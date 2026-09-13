// KisanSetu - Supabase Client
const SUPABASE_URL = 'https://khlkheamsqilfbjnilhk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobGtoZWFtc3FpbGZiam5pbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNzI0OTcsImV4cCI6MjEwNDg0ODQ5N30.ily9fxv7oeay3HjIXylADYmoMIj-CWvg3oKUwY9JMVU';

// Supabase v2 CDN exposes: window.supabase.createClient
// We need to be careful not to shadow window.supabase with our variable
const _sb = window.supabase;
if (!_sb || !_sb.createClient) {
  console.error('Supabase SDK not loaded! Make sure the CDN script is included before this file.');
}
const supabase = _sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log('Supabase client initialized successfully');
