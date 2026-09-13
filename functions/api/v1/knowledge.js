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
    if (context.request.method === "GET") return json({ ok: true, data: await storage.listKnowledge(company.id, assistant.id), request_id: requestId });
    if (context.request.method === "POST") {
      const input = await context.request.json();
      const sourceUri = typeof input?.source_uri === "string" ? input.source_uri.trim() : typeof input?.url === "string" ? input.url.trim() : "";
      if (!sourceUri || !/^https?:\/\//i.test(sourceUri)) return json({ ok: false, error: { code: "VALIDATION_FAILED", message: "A valid HTTP(S) source URL is required." }, request_id: requestId }, 400);
      const data = await storage.addKnowledge(company.id, assistant.id, { source_type: "url", name: input?.name || sourceUri, source_uri: sourceUri, status: "pending", metadata: {} });
      return json({ ok: true, data, request_id: requestId }, 201);
    }
    return json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." }, request_id: requestId }, 405);
  } catch (error) {
    const status = error instanceof PersistenceNotConfiguredError || error instanceof SupabaseNotConfiguredError ? 503 : error instanceof SupabaseRequestError ? 502 : 500;
    return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Enterprise persistence is not configured correctly yet." : "Enterprise request failed." }, request_id: requestId }, status);
  }
}
