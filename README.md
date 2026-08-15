# Rick's Pro Shop · Rental Manager (v3 — Netlify + direct Supabase)

Same UI as the original static demo. Now backed by Supabase, with a
Shopify order sync, on Netlify's free tier (chosen over Vercel because
Netlify's free tier allows commercial use).

**Login:** shared staff passcode (real Supabase Auth login now — see the
security section below for what changed and why)

---

## Architecture — and why it's built this way

- **Frontend talks to Supabase directly**, using the *publishable* key
  (`frontend/supabase-config.js`) and Row Level Security policies
  (`supabase/schema.sql`). No backend API for listing, creating, or
  updating rentals — the browser calls Supabase's REST API itself.
- **One Netlify Function** (`netlify/functions/shopify-sync.js`) exists
  only because it holds the one genuine secret in this app: the Shopify
  Admin API token. That token can't go in the browser — anyone could
  copy it out of the page and hit Shopify's real API with it. Everything
  else (reads/writes to Supabase) uses the same publishable key the
  frontend uses, not a service-role key.

**Why not the Supabase secret/service-role key at all?** The service-role
key bypasses RLS entirely — anything holding it has full, unrestricted
database access, including tables and operations this app doesn't even
use. The only reason to reach for it is a case RLS genuinely can't
handle. There isn't one here: the frontend needs to read/write the
`rentals` table, and RLS already grants that to the publishable key (see
below); the sync function needs the same. So the service-role key is
simply never used anywhere in this codebase.

**Why this keeps Netlify usage (and cost) low**: regular app usage —
staff opening the app, checking in a rental, editing setup details —
never touches a Netlify Function at all, since it talks to Supabase
directly. The only function invocation is the Shopify sync, and that
only runs when someone taps the sync button. Free-tier Netlify function
limits aren't a realistic concern at this usage pattern.

## ⚠️ Read this before going live: the shared staff login

This app has one login for everyone — no individual staff accounts. The
in-app passcode screen calls Supabase Auth (`signInWithPassword`) against
a single shared account, and RLS policies are scoped to `authenticated`
(see `supabase/schema.sql`) — so without a valid session, nobody can read
or write the `rentals` table at all, even with the publishable key.
**This is now a real access boundary**, not a UI-only PIN — earlier
versions of this app used `anon` RLS policies, which meant the table was
reachable directly by anyone who copied the publishable key out of the
page source. That's fixed.

What this doesn't give you: since it's one shared account, there's no
per-staff audit trail (you can't tell which staff member made a change),
and revoking access means changing the passcode for everyone, not just
one person. Fine for a small shop; worth knowing if that ever matters
enough to want individual logins instead — that'd be a bigger change
(a real staff-accounts system), not built here.

**Treat the passcode like a real password, because it is one now** — it's
literally the password to a Supabase Auth account guarding customer
names, contact info, and physical measurements (including for minors).
Don't reuse something trivial.

## One-time setup (~20 min)

**1. Supabase — schema**
- Open your project: `vfefipwxeqefdtspzowk`.
- SQL Editor → paste `supabase/schema.sql` → Run. Creates the table,
  indexes, RLS policies (scoped to `authenticated`), and a couple of demo
  rows so the app isn't blank on first load.

**2. Supabase — staff login**
- Authentication → Users → Add user.
- Email: `staff@ricksproshop.local` (must match `STAFF_EMAIL` in
  `frontend/supabase-config.js` — already set to this by default).
- Password: pick a real one, 6+ characters (Supabase's minimum) — this
  is also the 6-digit passcode staff will type into the app, so digits
  only if you want it to work cleanly on the numeric keypad.
- Toggle "Auto Confirm User" on (should be the default for users created
  this way) — the app only ever calls sign-in, never self-serve sign-up,
  so an unconfirmed account would just fail to log in.

**3. Shopify**
- Rick's store already has a "Rental App" installed with the right
  scopes (`read_orders`, `read_customers`, `read_products`) — reuse it.
- Settings → Apps and sales channels → Develop apps → Rental App → API
  credentials → reveal the Admin API access token → copy it straight
  into Netlify (next step), not into a chat or a text file.
- Rentals are identified by **product**, not a tag — any line item whose
  title/SKU contains `rental` is treated as one. See the comment block
  at the top of `shopify-sync.js` for the full logic.
- **This only ever reads from Shopify** — it never fulfills, edits, or
  creates anything in Shopify, and nothing about the live store or
  checkout is touched by running a sync. Only rental products are ever
  imported; nothing retail. The app also never creates orders back in
  Shopify — a walk-in created in-app only ever writes to Supabase.

**4. Netlify**
- Import this repo (or drag-and-drop the folder into a new Netlify site).
- Site configuration → Environment variables, add (see `.env.example`):
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (the publishable key)
  - `STAFF_EMAIL` (same as step 2)
  - `STAFF_PASSWORD` (same password as step 2 — this one's a real secret)
  - `SHOPIFY_DOMAIN`
  - `SHOPIFY_ADMIN_TOKEN`
  - `SHOPIFY_RENTAL_KEYWORD` (optional, defaults to `rental`)
- Deploy.
- Open the app, enter the passcode from step 2, then use the topbar sync
  icon (or Settings → Shopify Sync) to pull in real orders for the first
  time.

**One operational note**: free-tier Supabase projects auto-pause after 7
days with no activity. For a seasonal ski shop, that could mean the
database is paused going into the season if nobody's opened the app —
worth a quick check (or a calendar reminder) before opening day if it's
been idle a while. Waking a paused project just takes opening it in the
Supabase dashboard.

## Real-time sync (optional, in addition to the manual button)

By default, rentals only pull in from Shopify when someone taps the sync
button. `netlify/functions/shopify-webhook.js` adds a real-time path —
Shopify pushes each new order to this function the moment it's placed,
instead of waiting for the next manual sync. Both use the exact same
mapping logic (`netlify/functions/_lib/shopify-mapping.js`) and both
upsert on `shopify_line_item_id`, so running one after the other never
creates duplicates — the manual button remains a useful backup even with
the webhook active.

**Setup:**
- Shopify Admin → Settings → Notifications → scroll to Webhooks → Create webhook
  - Event: `Order creation`
  - Format: `JSON`
  - URL: `https://ricksproshop.netlify.app/.netlify/functions/shopify-webhook`
    (the direct function URL — not the `/api/*` alias, one less layer for
    Shopify's retries to hit)
- Copy the signing secret Shopify shows after saving.
- Netlify → Environment variables → add `SHOPIFY_WEBHOOK_SECRET` with that value.
- Redeploy.

This adds one more thing worth knowing given you asked earlier about
limiting Netlify usage: **every** order placed at the store — rental or
not — triggers this function once, since Shopify doesn't know which
orders are rentals until the function itself checks. Filtering happens
after receipt, same as manual sync. For a small shop's order volume this
is very unlikely to matter on the free tier, but it's a real (small)
increase in invocation count from before, worth knowing rather than
assuming it's free.

The webhook fails closed if `SHOPIFY_WEBHOOK_SECRET` isn't set — it
returns an error rather than silently accepting unverified requests to
what is otherwise a publicly guessable URL. Until you've done the setup
above, the manual sync button is the only path — that's expected, not
broken.

## Known limitations / things to revisit

- **DIN calculator**: the math is internally consistent, but the
  "verified against RentMaxZ" claim from the original demo couldn't be
  confirmed, so that wording was removed from the UI. Worth checking
  against a current ISO 11088 chart before relying on it for real
  binding settings.
- **No return/end date is captured at checkout** — only a pickup date.
  Synced rentals default to `days: 1` unless the variant title looks
  like a multi-day promo (e.g. "2 for 3" is read as a 3-day rental — a
  best-effort guess, confirm this interpretation is actually right).
  Staff set the real return date in setup, same as a walk-in.
- **Shoe size units aren't consistent across products** — one real order
  reports Mondopoint/cm sizing (`23.5`), another reports US sizing (`8`).
  Both get stored as-is in the same field without guessing which scale
  is which — worth having staff sanity-check this at setup rather than
  trusting it blindly, since it feeds into fitting decisions.
- **BSL (boot sole length) isn't captured at checkout** — still a manual
  in-store measurement step.
- **Multi-item orders are grouped by name**: if one person rents two
  separate line items (e.g. a snowboard + a helmet), they're merged into
  one rental card. Grouping is by matching first+last name within the
  order — if a checkout property is left blank, grouping falls back to
  treating that line item as its own person.
- **Only tested against seven real orders** covering every current
  product type. Good coverage, but not exhaustive — worth a quick check
  after the first real sync that everything landed as expected.
- **Re-sync overwrites manual edits** on Shopify-sourced rentals (it
  upserts the full row by `shopify_line_item_id`). Fine for picking up
  status changes from Shopify, but if staff edit a synced rental's
  details in-app and then re-sync, those edits get overwritten. Flag if
  that's not the behavior you want.
- **PIN is now a real login, not just a UI gate** — see the section above.
  Still worth knowing it's one shared account, not per-staff.

## Local dev

```
npm install
npx netlify dev
```
