// Maps between the Supabase `rentals` table (snake_case columns) and the
// camelCase rental object shape the frontend (trekker.js) uses. Kept in
// one place so the sync function and the frontend never drift apart —
// frontend/trekker.js has its own copy of toRow/toClient for the same
// reason browsers can't `require()` this file directly; keep both in sync
// if a field is ever added.

function toRow(r) {
  return {
    id: r.id,
    first_name: r.firstName || null,
    last_name: r.lastName || null,
    name: r.name || null,
    package: r.package || null,
    status: r.status || "setup",
    order_number: r.order || null,
    is_shopify: !!r.isShopify,
    shopify_order_id: r.shopifyOrderId ? String(r.shopifyOrderId) : null,
    shopify_line_item_id: r.shopifyLineItemId ? String(r.shopifyLineItemId) : null,
    start_date: r.startDate || null,
    end_date: r.endDate || null,
    days: r.days || 1,
    phone: r.phone || null,
    email: r.email || null,
    waiver: !!r.waiver,
    is_minor: !!r.isMinor,
    is_returning: !!r.isReturning,
    is_overdue: !!r.isOverdue,
    din: r.din === undefined || r.din === "" ? null : r.din,
    weight: r.weight === undefined || r.weight === "" ? null : r.weight,
    height_ft: r.heightFt === undefined || r.heightFt === "" ? null : r.heightFt,
    height_in: r.heightIn === undefined || r.heightIn === "" ? null : r.heightIn,
    shoe: r.shoe === undefined || r.shoe === "" ? null : r.shoe,
    bsl: r.bsl === undefined || r.bsl === "" ? null : r.bsl,
    age: r.age === undefined || r.age === "" ? null : r.age,
    experience: r.experience || null,
    skier_type: r.skierType || null,
    rental_type: r.rentalType || null,
    equipment: Array.isArray(r.equipment) ? r.equipment : [],
    notes: r.notes || ""
  };
}

module.exports = { toRow };
