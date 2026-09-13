// KisanSetu - Auth Module
(function() {
  const AUTH = {};
  
  function sb() {
    if (!window.supabaseClient && window.supabase && typeof window.supabase.createClient === 'function') {
      window.supabaseClient = window.supabase.createClient(
        'https://khlkheamsqilfbjnilhk.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobGtoZWFtc3FpbGZiam5pbGhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyNzI0OTcsImV4cCI6MjEwNDg0ODQ5N30.ily9fxv7oeay3HjIXylADYmoMIj-CWvg3oKUwY9JMVU'
      );
    }
    return window.supabaseClient;
  }
  
  // Get current session
  AUTH.getSession = async function() {
    const client = sb();
    if (!client) return null;
    const { data: { session } } = await client.auth.getSession();
    return session;
  };
  
  // Get current user
  AUTH.getUser = async function() {
    const client = sb();
    if (!client) return null;
    const { data: { user } } = await client.auth.getUser();
    return user;
  };
  
  // Get user's profile from DB
  AUTH.getProfile = async function() {
    const client = sb();
    if (!client) return null;
    const user = await AUTH.getUser();
    if (!user) return null;
    const { data } = await client.from('profiles').select('*').eq('id', user.id).single();
    return data;
  };
  
  // Get auth token for API calls
  AUTH.getToken = async function() {
    const session = await AUTH.getSession();
    return session?.access_token || null;
  };
  
  // API fetch helper with auth
  AUTH.apiFetch = async function(url, options = {}) {
    const token = await AUTH.getToken();
    if (!token) {
      window.location.href = '/auth.html';
      return null;
    }
    const headers = { 'Authorization': 'Bearer ' + token, ...options.headers };
    if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    } else if (typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      window.location.href = '/auth.html';
      return null;
    }
    return res;
  };
  
  // Sign up with email
  AUTH.signUp = async function(email, password, role, fullName) {
    const client = sb();
    if (!client) throw new Error('Supabase client not initialized');
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName }
      }
    });
    return { data, error };
  };
  
  // Sign in with email
  AUTH.signIn = async function(email, password) {
    const client = sb();
    if (!client) throw new Error('Supabase client not initialized');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    return { data, error };
  };
  
  // Sign in with Google
  AUTH.signInWithGoogle = async function(role) {
    const client = sb();
    if (!client) throw new Error('Supabase client not initialized');
    // Store role in localStorage so we can set it after redirect
    if (role) localStorage.setItem('ks_signup_role', role);
    const redirectUrl = window.location.origin + '/auth.html?callback=true';
    console.log('Google OAuth redirectTo:', redirectUrl);
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });
    return { data, error };
  };
  
  // Sign out
  AUTH.signOut = async function() {
    const client = sb();
    if (client) await client.auth.signOut();
    window.location.href = '/';
  };
  
  // Check if user is logged in, redirect to auth if not
  AUTH.requireAuth = async function() {
    const session = await AUTH.getSession();
    if (!session) {
      window.location.href = '/auth.html';
      return false;
    }
    return true;
  };
  
  // Redirect to appropriate dashboard based on role
  AUTH.redirectToDashboard = async function() {
    const savedRole = localStorage.getItem('ks_signup_role');
    let profile = await AUTH.getProfile();
    
    // If the user selected a specific role, sync it to their profile in Supabase
    if (savedRole) {
      const user = await AUTH.getUser();
      if (user && profile && profile.role !== savedRole) {
        const client = sb();
        if (client) {
          await client.from('profiles').update({ role: savedRole }).eq('id', user.id);
          profile = await AUTH.getProfile();
        }
      }
    }
    
    const role = profile?.role || savedRole || 'farmer';
    if (role === 'farmer') {
      window.location.href = '/farmer.html';
    } else {
      window.location.href = '/consumer.html';
    }
  };
  
  // Switch role between farmer and consumer
  AUTH.switchRole = async function(newRole) {
    localStorage.setItem('ks_signup_role', newRole);
    const client = sb();
    const user = await AUTH.getUser();
    if (client && user) {
      await client.from('profiles').update({ role: newRole }).eq('id', user.id);
    }
    if (newRole === 'farmer') {
      window.location.href = '/farmer.html';
    } else {
      window.location.href = '/consumer.html';
    }
  };
  
  // Handle Google OAuth callback - check if role needs to be set
  AUTH.handleCallback = async function() {
    const client = sb();
    if (!client) return;
    const role = localStorage.getItem('ks_signup_role') || 'farmer';
    const user = await AUTH.getUser();
    if (user) {
      // Update profile role with the user's chosen role
      await client.from('profiles').update({ 
        role: role,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
      }).eq('id', user.id);
    }
  };
  
  window.KS_AUTH = AUTH;
})();
