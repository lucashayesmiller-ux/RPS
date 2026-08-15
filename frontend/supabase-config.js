// The publishable key is DESIGNED to be public — it's shipped to every
// browser that loads this page, same as this file itself. It's not a
// secret; access control lives entirely in Supabase's Row Level Security
// policies (supabase/schema.sql), not in hiding this key.
const SUPABASE_URL = "https://vfefipwxeqefdtspzowk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rzh5gxGVFjHqZbLsz1isvw_cLE6qEB9";

const STAFF_EMAIL = "staff@ricksproshop.local"; // not a secret — just the shared staff account's identifier; the passcode staff type in-app is the actual password

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
