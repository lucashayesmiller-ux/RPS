-- Run this once in your Supabase project's SQL editor (Dashboard → SQL
-- Editor → New query → paste → Run). Safe to re-run — everything is
-- "if not exists" / "or replace".

create table if not exists rentals (
  id                    bigint primary key,
  first_name            text,
  last_name             text,
  name                  text,
  package               text,
  status                text default 'setup',
  order_number          text,
  is_shopify            boolean default false,
  shopify_order_id      text,
  shopify_line_item_id  text,
  start_date            text,
  end_date              text,
  days                  integer default 1,
  phone                 text,
  email                 text,
  waiver                boolean default false,
  is_minor              boolean default false,
  is_returning          boolean default false,
  is_overdue            boolean default false,
  din                   numeric,
  weight                numeric,
  height_ft             integer,
  height_in             integer,
  shoe                  numeric,
  bsl                   numeric,
  age                   integer,
  experience            text,
  skier_type            text,
  rental_type           text,
  equipment             jsonb default '[]'::jsonb,
  notes                 text default '',
  created_at            timestamptz default now()
);

-- Required for Shopify sync's upsert to work correctly. This is on the
-- LINE ITEM id (of the "primary" person in a group — see shopify-sync.js),
-- not the order id, because one order can contain more than one renter.
create unique index if not exists rentals_shopify_line_item_id_idx
  on rentals (shopify_line_item_id)
  where shopify_line_item_id is not null;

create index if not exists rentals_status_idx on rentals (status);
create index if not exists rentals_start_date_idx on rentals (start_date);

/* ═══════════════════════════════════════════════════════════════════════
   ROW LEVEL SECURITY

   This app uses ONE shared staff login (Supabase Auth, email/password —
   see the setup steps in README.md) rather than individual staff
   accounts. The in-app "passcode" screen calls
   supabase.auth.signInWithPassword() with that shared account, so a
   successful passcode entry produces a real Supabase session — that's
   what these policies check for, scoped to the `authenticated` role
   instead of `anon`.

   This is a real access boundary now: without a valid session, the
   publishable key alone (visible to anyone via page source) grants NO
   access to this table — RLS denies everything to `anon`. The passcode
   is the actual password to a real account, so treat it like one (not
   "123456") — it's now the only thing standing between the internet and
   customer names, contact info, and physical measurements (including for
   minors) stored here.

   Known limitation of a SHARED account: no per-staff audit trail, and no
   way to revoke one person's access without changing the passcode for
   everyone. Fine for a small shop; worth knowing if that ever matters.

   No DELETE policy is defined on purpose — the app has no delete feature,
   so without an explicit policy RLS denies it entirely by default.
═══════════════════════════════════════════════════════════════════════ */

alter table rentals enable row level security;

drop policy if exists "rentals_select_anon" on rentals;
drop policy if exists "rentals_insert_anon" on rentals;
drop policy if exists "rentals_update_anon" on rentals;

drop policy if exists "rentals_select_authenticated" on rentals;
create policy "rentals_select_authenticated" on rentals
  for select to authenticated using (true);

drop policy if exists "rentals_insert_authenticated" on rentals;
create policy "rentals_insert_authenticated" on rentals
  for insert to authenticated with check (true);

drop policy if exists "rentals_update_authenticated" on rentals;
create policy "rentals_update_authenticated" on rentals
  for update to authenticated using (true) with check (true);

/* ═══════════════════════════════════════════════════════════════════════
   SEED DATA — a handful of walk-in-style demo rentals so the live app has
   something to show immediately, before the first real Shopify sync runs.
   Same shape as the original static demo's sample data. Safe to delete
   these rows once real data is flowing — nothing depends on them.
═══════════════════════════════════════════════════════════════════════ */

insert into rentals (
  id, first_name, last_name, name, package, status, order_number, is_shopify,
  start_date, end_date, days, phone, email, waiver, is_minor, is_returning,
  is_overdue, din, weight, height_ft, height_in, shoe, bsl, age, experience,
  skier_type, rental_type, equipment, notes
) values
  (1001, 'Maksim', 'Volkov', 'Maksim Volkov', 'Adult Ski Package', 'out', 'WALK-IN', false,
   'Today', null, 1, '555-0101', 'maksim@example.com', true, false, false, false,
   3.75, 212, 5, 11, 10, 305, 25, 'Beginner', 'Type I (Beginner/Cautious)', 'Ski',
   '["Adult Ski Package"]'::jsonb, ''),
  (1002, 'Claire', 'Dubois', 'Claire Dubois', 'Snowboard Package', 'setup', 'WALK-IN', false,
   'Today', null, 2, '555-0102', 'claire@example.com', false, false, true, false,
   null, 140, 5, 6, 8, 265, 31, 'Intermediate', 'Type II (Intermediate)', 'Snowboard',
   '["Snowboard Package"]'::jsonb, '')
on conflict (id) do nothing;
