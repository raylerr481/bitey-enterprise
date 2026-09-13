// Supabase authentication bridge for Bitey Enterprise Web.
// Only the publishable/anon key belongs in browser configuration.
(function () {
  'use strict';

  const config = window.BITEY_ENTERPRISE_SUPABASE || {};
  const url = typeof config.url === 'string' ? config.url.trim() : '';
  const key = typeof config.publishableKey === 'string' ? config.publishableKey.trim() : '';
  let client = null;
  let currentSession = null;

  function available() {
    return Boolean(url && key && window.supabase?.createClient);
  }

  if (available()) {
    client = window.supabase.createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });

    client.auth.getSession().then(({ data }) => {
      currentSession = data?.session || null;
      window.dispatchEvent(new CustomEvent('bitey-auth-ready', { detail: currentSession }));
    });

    client.auth.onAuthStateChange((_event, session) => {
      currentSession = session || null;
      window.dispatchEvent(new CustomEvent('bitey-auth-change', { detail: currentSession }));
    });
  }

  async function signIn(email, password) {
    if (!client) return { ok: false, error: 'AUTH_NOT_CONFIGURED' };
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message || 'AUTH_SIGN_IN_FAILED' };
    currentSession = data?.session || null;
    return { ok: true, session: currentSession, user: data?.user || null };
  }

  async function signOut() {
    if (!client) return { ok: false, error: 'AUTH_NOT_CONFIGURED' };
    const { error } = await client.auth.signOut();
    if (error) return { ok: false, error: error.message || 'AUTH_SIGN_OUT_FAILED' };
    currentSession = null;
    return { ok: true };
  }

  async function getAccessToken() {
    if (!client) return null;
    const { data } = await client.auth.getSession();
    currentSession = data?.session || null;
    return currentSession?.access_token || null;
  }

  window.BiteyEnterpriseAuth = Object.freeze({
    configured: available,
    signIn,
    signOut,
    getAccessToken,
    getSession: () => currentSession,
    getUser: () => currentSession?.user || null
  });
})();
