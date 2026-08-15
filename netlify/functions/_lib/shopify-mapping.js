// Shared Shopify order → rental mapping, used by BOTH shopify-sync.js
// (manual/polling sync) and shopify-webhook.js (real-time push). Kept in
// exactly one place on purpose — this logic was built and validated
// against seven real orders across every current product (see git
// history / README for specifics: typo'd property suffixes, a compact
// date format, multi-item orders for one person, "2 for 3" pricing).
// A second copy of this logic WILL drift and silently reintroduce bugs
// that were already found and fixed — that's exactly what happened with
// an earlier draft of the webhook, which is why this file exists.

const KNOWN_BASE_KEYS = [
  "first-name", "last-name", "gender", "age", "ability", "shoe-size",
  "shoe-size-type", "height-ft", "height-in", "weight", "pickup-date",
  "tod-pickup", "return-agreement", "liab-agree", "birthday",
  "helmet-size", "foot-width", "stance"
];

function isRentalLineItem(li, keyword) {
  const t = ((li.title || "") + " " + (li.sku || "")).toLowerCase();
  return t.includes(keyword);
}

// Strips a trailing "-xxxx" suffix token and checks the result against
// KNOWN_BASE_KEYS — robust to suffix typos (e.g. real data had
// "liab-agree-SRSR" where every sibling property used "-SRSP").
function normalizeKey(rawName) {
  const key = (rawName || "").toLowerCase().replace(/_copy$/, "");
  if (KNOWN_BASE_KEYS.includes(key)) return key;
  const stripped = key.replace(/-[a-z0-9]+$/, "");
  if (KNOWN_BASE_KEYS.includes(stripped)) return stripped;
  return key;
}

function normalizeProps(properties) {
  const out = {};
  (properties || []).forEach((p) => { out[normalizeKey(p.name)] = p.value; });
  return out;
}

function numOrNull(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Handles both "2026-03-19" and the compact "20260318" format seen in
// one real order.
function parseFlexibleDate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  let m = /^(\d{4})(\d{2})(\d{2})$/.exec(s);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(raw) {
  const dt = parseFlexibleDate(raw);
  if (!dt) return raw || null;
  return dt.toLocaleDateString("en-CA", { timeZone: "UTC", month: "short", day: "numeric" });
}

// "2 for 3" promo pricing is read as "3 total days" — a best-effort
// guess, not a confirmed mapping (flagged in README). "N day(s)" is
// read literally.
function parseDaysFromVariant(lineItem) {
  const vt = (lineItem.variant_title || "").toLowerCase();
  let m = /(\d+)\s*for\s*(\d+)/.exec(vt);
  if (m) return Math.max(1, parseInt(m[2], 10));
  m = /(\d+)\s*day/.exec(vt);
  if (m) return Math.max(1, parseInt(m[1], 10));
  return 1;
}

function abilityToSkierType(ability) {
  if (/advanc|expert/i.test(ability)) return "Type III (Advanced/Aggressive)";
  if (/interm/i.test(ability)) return "Type II (Intermediate)";
  return "Type I (Beginner/Cautious)";
}

// Groups an order's rental line items by (first + last name) so one
// person renting multiple items (e.g. a snowboard + a helmet as separate
// line items) becomes one rental record, not two disconnected ones.
function groupLineItemsByPerson(rentalLines) {
  const order = [];
  const groups = {};
  rentalLines.forEach((li) => {
    const props = normalizeProps(li.properties || []);
    const first = props["first-name"] || "";
    const last = props["last-name"] || "";
    const key = (first + " " + last).trim().toLowerCase() || ("li-" + li.id);
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push({ lineItem: li, props });
  });
  return order.map((key) => groups[key]);
}

function mapGroupToRental(order, group) {
  const primary = group.find((g) => g.props["weight"] !== undefined) || group[0];
  const props = primary.props;
  const customer = order.customer || {};
  const shipping = order.shipping_address || {};
  const billing = order.billing_address || {};

  const firstName = props["first-name"] || customer.first_name || billing.first_name || "";
  const lastName = props["last-name"] || customer.last_name || billing.last_name || "";
  const name = (firstName + " " + lastName).trim() || order.email || "Shopify Customer";

  const pkg = primary.lineItem.title || "Rental";
  const equipment = group.map((g) => g.lineItem.title || "Rental");
  const isSnow = equipment.some((t) => t.toLowerCase().includes("snowboard"));

  const ability = props["ability"] || "";
  const waiverAgreed = !!(props["liab-agree"] && props["return-agreement"]);

  const noteParts = [];
  if (order.note) noteParts.push(order.note);
  group.forEach((g) => {
    if (g.props["helmet-size"]) noteParts.push((g.lineItem.title || "Item") + " — helmet size " + g.props["helmet-size"]);
  });

  return {
    id: primary.lineItem.id,
    firstName, lastName, name,
    package: pkg,
    status: "setup",
    order: order.name,
    isShopify: true,
    shopifyOrderId: String(order.id),
    shopifyLineItemId: String(primary.lineItem.id),
    startDate: fmtDate(props["pickup-date"]) || fmtDate(order.created_at),
    endDate: null,
    days: parseDaysFromVariant(primary.lineItem),
    phone: customer.phone || shipping.phone || billing.phone || "",
    email: order.email || customer.email || "",
    waiver: waiverAgreed,
    isMinor: false,
    isReturning: (customer.orders_count || 0) > 1,
    isOverdue: false,
    din: null,
    weight: numOrNull(props["weight"]),
    heightFt: numOrNull(props["height-ft"]),
    heightIn: numOrNull(props["height-in"]),
    shoe: numOrNull(props["shoe-size"]),
    bsl: null,
    age: numOrNull(props["age"]),
    experience: ability || "Beginner",
    skierType: abilityToSkierType(ability),
    rentalType: isSnow ? "Snowboard" : "Ski",
    equipment,
    notes: noteParts.join(" · ")
  };
}

function mapOrderToRentals(order, keyword) {
  const rentalLines = (order.line_items || []).filter((li) => isRentalLineItem(li, keyword));
  const groups = groupLineItemsByPerson(rentalLines);
  return groups.map((g) => mapGroupToRental(order, g));
}

module.exports = { mapOrderToRentals };
