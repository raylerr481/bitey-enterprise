import { createStorage, PersistenceNotConfiguredError } from "../../lib/storage.js";
import { createSupabaseClient, getBearerToken, SupabaseNotConfiguredError, SupabaseRequestError } from "../../lib/supabase.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

async function contextForRequest(context) {
  const token = getBearerToken(context.request);
  if (!token) return { error: json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: crypto.randomUUID() }, 401) };
  const supabase = createSupabaseClient(context.env);
  const user = await supabase.getUser(token);
  if (!user) return { error: json({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: crypto.randomUUID() }, 401) };
  const storage = createStorage(context.env, token);
  const company = await storage.getCompanyForUser(user.id);
  if (!company?.id) return { error: json({ ok: false, error: { code: "COMPANY_NOT_FOUND", message: "No company is assigned to this user." }, request_id: crypto.randomUUID() }, 404) };
  return { storage, company };
}

function failure(error) {
  const status = error instanceof PersistenceNotConfiguredError || error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
  return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Enterprise persistence is not configured yet." : status === 502 ? "Enterprise data request failed." : "Enterprise request failed." }, request_id: crypto.randomUUID() }, status);
}

export async function onRequestGet(context) {
  try {
    const resolved = await contextForRequest(context);
    if (resolved.error) return resolved.error;
    return json({ ok: true, data: await resolved.storage.getAssistant(resolved.company.id), request_id: crypto.randomUUID() });
  } catch (error) { return failure(error); }
}

export async function onRequestPut(context) {
  try {
    const resolved = await contextForRequest(context);
    if (resolved.error) return resolved.error;
    const body = await context.request.json().catch(() => ({}));
    const assistant = await resolved.storage.upsertAssistant(resolved.company.id, body);
    return json({ ok: true, data: assistant, request_id: crypto.randomUUID() });
  } catch (error) { return failure(error); }
}
