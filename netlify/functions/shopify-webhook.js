const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { toRow } = require("./_lib/mapping");
const { mapOrderToRentals } = require("./_lib/shopify-mapping");

/* ═══════════════════════════════════════════════════════════════════════
   Netlify Function — real-time push counterpart to shopify-sync.js.
   Shopify calls this the moment an order is created; no polling needed.
   Uses the exact same mapping logic as shopify-sync.js (imported from
   ./_lib/shopify-mapping, not duplicated) — every fix that came out of
   testing against real orders applies here automatically.

   SHOPIFY SAFETY: receive-only. Never calls any Shopify API endpoint,
   never writes anything back to Shopify.

   SETUP (one-time, in Shopify Admin):
     Settings → Notifications → Webhooks → Create webhook
     Event:  Orders / Order creation
     Format: JSON
     URL:    https://ricksproshop.netlify.app/.netlify/functions/shopify-webhook
             (the direct function URL, not the /api/* alias — one less
             layer of indirection for something Shopify will retry
             aggressively on failure)
   Then copy the signing secret Shopify shows you into Netlify as
   SHOPIFY_WEBHOOK_SECRET, and redeploy.

   HMAC verification: Shopify signs the RAW bytes it sent, so this reads
   event.body directly (Netlify gives it to us as a string, unparsed)
   and verifies BEFORE calling JSON.parse — re-serializing an
   already-parsed object and verifying against that is unreliable
   (key order / number formatting can differ from the original bytes)
   and was a real bug in an earlier draft of this file.

   This fails CLOSED if SHOPIFY_WEBHOOK_SECRET isn't set — returns 503
   rather than silently accepting unverified writes to a publicly
   guessable URL. Configure it before relying on this.
═══════════════════════════════════════════════════════════════════════ */

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed — don't accept unverified writes to a guessable URL.
    console.error("SHOPIFY_WEBHOOK_SECRET not set — refusing webhook payload");
    return { statusCode: 503, body: JSON.stringify({ error: "Webhook secret not configured" }) };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "");

  const shopifyHmac = (event.headers && (event.headers["x-shopify-hmac-sha256"] || event.headers["X-Shopify-Hmac-Sha256"])) || "";
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");

  // Constant-time comparison — plain !== leaks timing information.
  const validHmac = shopifyHmac.length > 0
    && digest.length === shopifyHmac.length
    && crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(shopifyHmac));

  if (!validHmac) {
    console.error("Invalid webhook HMAC — rejected");
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid HMAC" }) };
  }

  let order;
  try {
    order = JSON.parse(rawBody);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON payload" }) };
  }
  if (!order || !order.id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Empty or invalid order payload" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const staffEmail = process.env.STAFF_EMAIL;
  const staffPassword = process.env.STAFF_PASSWORD;
  const keyword = (process.env.SHOPIFY_RENTAL_KEYWORD || "rental").toLowerCase();

  // Always ack 200 from here on for anything that isn't a config problem —
  // returning 4xx/5xx makes Shopify retry the same order repeatedly, and
  // config issues aren't going to fix themselves between retries. The
  // manual sync button is the backup path if something's misconfigured.
  if (!supabaseUrl || !supabaseKey || !staffEmail || !staffPassword) {
    console.error("Supabase/staff login not configured — webhook order not saved:", order.name);
    return { statusCode: 200, body: JSON.stringify({ ok: true, warning: "Backend not configured — order not saved, manual sync will catch it later" }) };
  }

  const mapped = mapOrderToRentals(order, keyword);
  if (mapped.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: "no rental line items" }) };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error: authError } = await supabase.auth.signInWithPassword({ email: staffEmail, password: staffPassword });
  if (authError) {
    console.error("Webhook couldn't log in to Supabase:", authError.message);
    return { statusCode: 200, body: JSON.stringify({ ok: true, warning: "Supabase login failed — manual sync will catch it later" }) };
  }

  let synced = 0;
  const errors = [];
  for (const r of mapped) {
    const row = toRow(r);
    const { error } = await supabase.from("rentals").upsert(row, { onConflict: "shopify_line_item_id" });
    if (error) { console.error("Upsert error:", error.message); errors.push(error.message); } else synced++;
  }

  return { statusCode: 200, body: JSON.stringify({ ok: errors.length === 0, synced, errors: errors.length ? errors : undefined }) };
};
