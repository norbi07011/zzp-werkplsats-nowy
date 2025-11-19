import { createClient } from "@supabase/supabase-js";

// Note: This is a diagnostic script, using service_role key for full access
const supabaseUrl = "https://dtnotuyagygexmkyqtgb.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bm90dXlhZ3lnZXhta3lxdGdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc4NTMzMCwiZXhwIjoyMDc1MzYxMzMwfQ.H-_sd9_qn40CfLD_dFschmDKkTbPP57lcfqp-20RVk8";

// Service role client for diagnostic purposes only
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  // Pobierz 1 rekord żeby zobaczyć strukturę
  const { data: msg } = await supabase
    .from("messages")
    .select("*")
    .limit(1)
    .single();
  console.log("📋 MESSAGES COLUMNS:", Object.keys(msg || {}));

  const { data: notif } = await supabase
    .from("notifications")
    .select("*")
    .limit(1)
    .single();
  console.log("📋 NOTIFICATIONS COLUMNS:", Object.keys(notif || {}));
}

checkColumns();
