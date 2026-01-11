// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Client Supabase (uniquement si les credentials sont configurées)
let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Supabase client initialisé');
} else {
  console.log('ℹ️ Supabase non configuré - mode stockage local');
}

export default supabase;
