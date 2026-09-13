import { createSupabaseClient, getBearerToken, SupabaseNotConfiguredError, SupabaseRequestError } from "../lib/supabase.js";

export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  const publicPaths = new Set(["/api/v1/health", "/api/v1/readiness"]);
  if (publicPaths.has(path)) return context.next();

  const token = getBearerToken(context.request);
  if (!token) {
    return new Response(JSON.stringify({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: crypto.randomUUID() }), { status: 401, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }

  try {
    const supabase = createSupabaseClient(context.env);
    const user = await supabase.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: crypto.randomUUID() }), { status: 401, headers: { "content-type": "application/json", "cache-control": "no-store" } });
    }
    context.data = { ...(context.data || {}), user: { id: user.id, email: user.email || null }, accessToken: token };
    return context.next();
  } catch (error) {
    const status = error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
    return new Response(JSON.stringify({ ok: false, error: { code: error.code || "AUTHENTICATION_FAILED", message: status === 503 ? "Authentication provider is not configured yet." : "Authentication validation failed." }, request_id: crypto.randomUUID() }), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  }
}
