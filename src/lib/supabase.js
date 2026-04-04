import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uslglszrdvghnctzyteh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbGdsc3pyZHZnaG5jdHp5dGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMDgzNTUsImV4cCI6MjA5MDg4NDM1NX0.PmvC97Ta9QeVaONzNYfT3c90185C8D6pxIomRdbVBRU";

export const supabase = createClient(supabaseUrl, supabaseKey);