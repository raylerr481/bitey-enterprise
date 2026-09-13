const ENTERPRISE_SCHEMA = "enterprise";

export function getBearerToken(request) {
  const value = request.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function createSupabaseClient(env = {}) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new SupabaseNotConfiguredError();

  async function request(path, options = {}, token = null) {
    const headers = new Headers(options.headers || {});
    headers.set("apikey", key);
    headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(`${url}${path}`, { ...options, headers });
  }

  async function getUser(token) {
    const response = await request("/auth/v1/user", {}, token);
    if (response.status === 401) return null;
    if (!response.ok) throw new SupabaseRequestError(response.status);
    return response.json();
  }

  async function rest(table, params = "", options = {}, token = null) {
    const headers = new Headers(options.headers || {});
    headers.set("Accept-Profile", ENTERPRISE_SCHEMA);
    headers.set("Content-Profile", ENTERPRISE_SCHEMA);
    return request(`/rest/v1/${table}${params}`, { ...options, headers }, token);
  }

  return Object.freeze({ getUser, rest });
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase server configuration is missing.");
    this.name = "SupabaseNotConfiguredError";
    this.code = "SUPABASE_NOT_CONFIGURED";
  }
}

export class SupabaseRequestError extends Error {
  constructor(status) {
    super(`Supabase request failed with status ${status}.`);
    this.name = "SupabaseRequestError";
    this.code = "SUPABASE_REQUEST_FAILED";
    this.status = status;
  }
}
