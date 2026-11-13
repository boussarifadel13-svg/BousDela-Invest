
// Configuration de BOUSDELA INVEST

const SUPABASE_URL = "https://uyqkbqiwzwddssgxleaw.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_mluSrlQMjFKEo0Wqj2kzRQ_426t3u0M";

// Initialisation du client Supabase
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
