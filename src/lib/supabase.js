import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xzsddpcjgdpgeqhudcpt.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6c2RkcGNqZ2RwZ2VxaHVkY3B0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjUzODgsImV4cCI6MjA3NzAwMTM4OH0.des72drIuYZtaa7GxhFkdvp8Bg7HKzr4nuCqM7TEgMA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
