// Backend adapter for Bitey Enterprise.
// No credentials or passwords are stored in this file or in browser storage.
// The adapter is deliberately Supabase-compatible: a future backend can expose
// the same session contract without forcing a frontend rewrite.

(function () {
  'use strict';

  const configuredBase = typeof window.BITEY_ENTERPRISE_API_URL === 'string'
    ? window.BITEY_ENTERPRISE_API_URL.trim()
    : '';
  const API_BASE = configuredBase.replace(/\/$/, '');

  async function request(path, options = {}) {
    if (!API_BASE) {
      return { ok: false, offline: true, error: { code: 'API_NOT_CONFIGURED' } };
    }

    try {
      const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          ...(options.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options.headers || {})
        },
        ...options
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) { payload = null; }
      if (!response.ok) {
        return { ok: false, status: response.status, error: payload?.error || { code: 'API_REQUEST_FAILED' } };
      }
      return payload || { ok: true, data: null };
    } catch (_) {
      return { ok: false, error: { code: 'NETWORK_ERROR' } };
    }
  }

  window.BiteyEnterpriseAPI = Object.freeze({
    configured: Boolean(API_BASE),
    get: (path) => request(path),
    put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
    post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    remove: (path) => request(path, { method: 'DELETE' }),
    auth: Object.freeze({
      session: () => request('/auth/session'),
      login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
      register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
      logout: () => request('/auth/logout', { method: 'POST' })
    })
  });
})();
