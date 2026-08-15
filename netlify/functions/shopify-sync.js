const { createClient } = require("@supabase/supabase-js");
const { toRow } = require("./_lib/mapping");
const { mapOrderToRentals } = require("./_lib/shopify-mapping");

const SHOPIFY_API_VERSION = "2024-10";

/* ═══════════════════════════════════════════════════════════════════════
   Netlify Function — manual/backup sync (pull-based). Fetches recent
   orders from Shopify and upserts any rental line items into Supabase.
   See netlify/functions/shopify-webhook.js for the real-time push-based
   counterpart — both share the exact same mapping logic from
   ./_lib/shopify-mapping.js, on purpose, so they can never drift apart.

   This function uses the SAME publishable key and the SAME shared staff
   login as the frontend, not a Supabase service-role key. RLS is scoped
   to `authenticated` (see supabase/schema.sql), so this function signs
   in as the shared staff account before writing — same access boundary
   as everyone else, no bypass.

   This function is READ-ONLY against Shopify — it only ever calls
   orders.json with GET. It never fulfills, edits, cancels, or creates
   anything in Shopify.
═══════════════════════════════════════════════════════════════════════ */

async function fetchShopifyOrders(domain, token) {
  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/orders.json?status=any&limit=100`;
  const resp = await fetch(url, {
    headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json" }
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Shopify API error ${resp.status}: ${text.slice(0, 300)}`);
  }
  const data = await resp.json();
  return data.orders || [];
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const staffEmail = process.env.STAFF_EMAIL;
  const staffPassword = process.env.STAFF_PASSWORD;
  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  const keyword = (process.env.SHOPIFY_RENTAL_KEYWORD || "rental").toLowerCase();

  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 503, body: JSON.stringify({ error: "Supabase isn't configured yet (missing SUPABASE_URL / SUPABASE_ANON_KEY)." }) };
  }
  if (!staffEmail || !staffPassword) {
    return { statusCode: 503, body: JSON.stringify({ error: "Staff login isn't configured yet (missing STAFF_EMAIL / STAFF_PASSWORD) — RLS now requires an authenticated session to write." }) };
  }
  if (!domain || !token) {
    return { statusCode: 503, body: JSON.stringify({ error: "Shopify isn't configured yet (missing SHOPIFY_DOMAIN / SHOPIFY_ADMIN_TOKEN)." }) };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const { error: authError } = await supabase.auth.signInWithPassword({ email: staffEmail, password: staffPassword });
  if (authError) {
    return { statusCode: 502, body: JSON.stringify({ error: "Sync couldn't log in to Supabase: " + authError.message }) };
  }

  try {
    const orders = await fetchShopifyOrders(domain, token);
    const mapped = orders.flatMap((o) => mapOrderToRentals(o, keyword));

    let synced = 0;
    const errors = [];
    for (const r of mapped) {
      const row = toRow(r);
      const { error } = await supabase.from("rentals").upsert(row, { onConflict: "shopify_line_item_id" });
      if (error) errors.push(error.message); else synced++;
    }

    return { statusCode: 200, body: JSON.stringify({ synced, checked: orders.length, matchedKeyword: keyword, errors }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
