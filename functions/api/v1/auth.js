import { createSupabaseClient, getBearerToken, SupabaseNotConfiguredError, SupabaseRequestError } from "../../lib/supabase.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequestGet(context) {
  const requestId = crypto.randomUUID();
  const token = getBearerToken(context.request);
  if (!token) return json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: requestId }, 401);

  try {
    const supabase = createSupabaseClient(context.env);
    const user = await supabase.getUser(token);
    if (!user) return json({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: requestId }, 401);
    return json({ ok: true, data: { user: { id: user.id, email: user.email || null } }, request_id: requestId });
  } catch (error) {
    const status = error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
    return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Authentication provider is not configured yet." : "Authentication validation failed." }, request_id: requestId }, status);
  }
}
