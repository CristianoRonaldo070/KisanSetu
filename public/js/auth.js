// KisanSetu - Auth Module
(function() {
  const AUTH = {};
  
  // Get current session
  AUTH.getSession = async function() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  };
  
  // Get current user
  AUTH.getUser = async function() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  };
  
  // Get user's profile from DB
  AUTH.getProfile = async function() {
    const user = await AUTH.getUser();
    if (!user) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
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
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      window.location.href = '/auth.html';
      return null;
    }
    return res.json();
  };
  
  // Sign up with email
  AUTH.signUp = async function(email, password, role, fullName) {
    const { data, error } = await supabase.auth.signUp({
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };
  
  // Sign in with Google
  AUTH.signInWithGoogle = async function(role) {
    // Store role in localStorage so we can set it after redirect
    if (role) localStorage.setItem('ks_signup_role', role);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth.html?callback=true',
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
    await supabase.auth.signOut();
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
    const profile = await AUTH.getProfile();
    if (profile) {
      if (profile.role === 'farmer') {
        window.location.href = '/farmer.html';
      } else {
        window.location.href = '/consumer.html';
      }
    }
  };
  
  // Handle Google OAuth callback - check if role needs to be set
  AUTH.handleCallback = async function() {
    const role = localStorage.getItem('ks_signup_role');
    if (role) {
      localStorage.removeItem('ks_signup_role');
      const user = await AUTH.getUser();
      if (user) {
        // Update profile role if it was a new Google signup
        await supabase.from('profiles').update({ 
          role: role,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User'
        }).eq('id', user.id);
      }
    }
  };
  
  window.KS_AUTH = AUTH;
})();
