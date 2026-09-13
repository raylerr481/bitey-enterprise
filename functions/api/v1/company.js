import { createStorage, PersistenceNotConfiguredError } from "../../lib/storage.js";
import { createSupabaseClient, getBearerToken, SupabaseNotConfiguredError, SupabaseRequestError } from "../../lib/supabase.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

export async function onRequestGet(context) {
  const requestId = crypto.randomUUID();
  const token = getBearerToken(context.request);
  if (!token) return json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: requestId }, 401);
  try {
    const supabase = createSupabaseClient(context.env);
    const user = await supabase.getUser(token);
    if (!user) return json({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: requestId }, 401);
    const storage = createStorage(context.env, token);
    return json({ ok: true, data: await storage.getCompanyForUser(user.id), request_id: requestId });
  } catch (error) {
    const status = error instanceof PersistenceNotConfiguredError ? 503 : error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
    return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Enterprise persistence is not configured yet." : status === 502 ? "Enterprise data request failed." : "Enterprise request failed." }, request_id: requestId }, status);
  }
}

export async function onRequestPut(context) {
  const requestId = crypto.randomUUID();
  const token = getBearerToken(context.request);
  if (!token) return json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: requestId }, 401);
  try {
    const supabase = createSupabaseClient(context.env);
    const user = await supabase.getUser(token);
    if (!user) return json({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: requestId }, 401);
    const current = await createStorage(context.env, token).getCompanyForUser(user.id);
    if (!current?.id) return json({ ok: false, error: { code: "COMPANY_NOT_FOUND", message: "No company is assigned to this user." }, request_id: requestId }, 404);
    const body = await context.request.json().catch(() => ({}));
    const updated = await createStorage(context.env, token).updateCompany(current.id, body);
    return json({ ok: true, data: updated, request_id: requestId });
  } catch (error) {
    const status = error instanceof PersistenceNotConfiguredError ? 503 : error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
    return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Enterprise persistence is not configured yet." : status === 502 ? "Enterprise data request failed." : "Enterprise request failed." }, request_id: requestId }, status);
  }
}
