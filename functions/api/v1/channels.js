import { createSupabaseClient, getBearerToken, SupabaseNotConfiguredError, SupabaseRequestError } from "../../lib/supabase.js";
import { createStorage, PersistenceNotConfiguredError } from "../../lib/storage.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export async function onRequest(context) {
  const requestId = crypto.randomUUID();
  const token = getBearerToken(context.request);
  if (!token) return json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: requestId }, 401);
  try {
    const supabase = createSupabaseClient(context.env);
    const user = await supabase.getUser(token);
    if (!user) return json({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: requestId }, 401);
    const storage = createStorage(context.env, token);
    const company = await storage.getCompanyForUser(user.id);
    if (!company) return json({ ok: false, error: { code: "COMPANY_NOT_FOUND", message: "No company is assigned to this user." }, request_id: requestId }, 404);
    const assistant = await storage.getAssistant(company.id);
    if (!assistant) return json({ ok: false, error: { code: "ASSISTANT_NOT_FOUND", message: "No assistant is configured for this company." }, request_id: requestId }, 404);
    if (context.request.method === "GET") return json({ ok: true, data: await storage.listChannels(company.id, assistant.id), request_id: requestId });
    if (context.request.method === "PATCH") {
      const input = await context.request.json();
      const channel = String(input?.channel || "").toLowerCase();
      if (!["web", "telegram", "whatsapp"].includes(channel)) return json({ ok: false, error: { code: "VALIDATION_FAILED", message: "Unsupported channel." }, request_id: requestId }, 400);
      const patch = {};
      if (typeof input?.enabled === "boolean") patch.enabled = input.enabled;
      if (typeof input?.external_identity === "string") patch.external_identity = input.external_identity.trim() || null;
      if (input?.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)) patch.metadata = input.metadata;
      const data = await storage.updateChannel(company.id, assistant.id, channel, patch);
      return json({ ok: true, data, activation_allowed: false, request_id: requestId });
    }
    return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." }, request_id: requestId }, 405);
  } catch (error) {
    const status = error instanceof PersistenceNotConfiguredError || error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
    return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Enterprise persistence is not configured correctly yet." : "Enterprise request failed." }, request_id: requestId }, status);
  }
}
