// Backend adapter for Bitey Enterprise.
// No credentials belong in this file or in browser storage.
(function () {
  'use strict';

  const configuredBase = typeof window.BITEY_ENTERPRISE_API_URL === 'string'
    ? window.BITEY_ENTERPRISE_API_URL.trim()
    : '/api/v1';
  const API_BASE = configuredBase.replace(/\/$/, '');

  async function request(path, options = {}) {
    if (!API_BASE) return { ok: false, offline: true, error: { code: 'API_NOT_CONFIGURED' } };
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) },
        ...options
      });
      let payload = null;
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok) return { ok: false, status: response.status, error: payload?.error || { code: 'API_REQUEST_FAILED' } };
      return payload || { ok: true, data: null };
    } catch (_) {
      return { ok: false, error: { code: 'API_UNREACHABLE' } };
    }
  }

  window.BiteyEnterpriseAPI = Object.freeze({
    configured: Boolean(API_BASE),
    get: (path) => request(path),
    put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
    post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    patch: (path, data) => request(path, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: (path) => request(path, { method: 'DELETE' })
  });
})();
