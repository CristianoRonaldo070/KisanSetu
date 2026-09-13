// KisanSetu - Supabase Client
const SUPABASE_URL = 'https://khlkheamsqilfbjnilhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobGtoZWFtc3FpbGZiam5pbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNzI0OTcsImV4cCI6MjEwNDg0ODQ5N30.ily9fxv7oeay3HjIXylADYmoMIj-CWvg3oKUwY9JMVU';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
