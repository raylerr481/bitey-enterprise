// Supabase authentication bridge for Bitey Enterprise Web.
// Only the publishable/anon key may reach browser code; never expose service_role/secret keys.
(function () {
  'use strict';

  let client = null;
  let currentSession = null;
  let configPromise = null;

  async function loadConfig() {
    if (configPromise) return configPromise;
    configPromise = fetch('/api/v1/config', { headers: { Accept: 'application/json' }, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then(async (payload) => {
        const data = payload?.data;
        if (!data?.supabase_url || !data?.publishable_key || !window.supabase?.createClient) return false;
        client = window.supabase.createClient(data.supabase_url, data.publishable_key, {
          auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        });
        client.auth.onAuthStateChange((_event, session) => {
          currentSession = session || null;
          window.dispatchEvent(new CustomEvent('bitey-auth-change', { detail: currentSession }));
        });
        const { data: sessionData } = await client.auth.getSession();
        currentSession = sessionData?.session || null;
        window.dispatchEvent(new CustomEvent('bitey-auth-ready', { detail: currentSession }));
        return true;
      })
      .catch(() => false);
    return configPromise;
  }

  async function signIn(email, password) {
    if (!client) await loadConfig();
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
    if (!client) await loadConfig();
    if (!client) return null;
    const { data } = await client.auth.getSession();
    currentSession = data?.session || null;
    return currentSession?.access_token || null;
  }

  window.BiteyEnterpriseAuth = Object.freeze({
    configured: () => Boolean(client),
    initialize: loadConfig,
    signIn,
    signOut,
    getAccessToken,
    getSession: () => currentSession,
    getUser: () => currentSession?.user || null
  });

  loadConfig();
})();
