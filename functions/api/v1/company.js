import { createStorage, PersistenceNotConfiguredError } from "../../lib/storage.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function onRequest(context) {
  try {
    const storage = createStorage(context.env);
    const userId = context.data?.user?.id;
    if (!userId) return json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: crypto.randomUUID() }, 401);
    const company = await storage.getCompanyForUser(userId);
    return json({ ok: true, data: company, request_id: crypto.randomUUID() });
  } catch (error) {
    const status = error instanceof PersistenceNotConfiguredError ? 503 : 500;
    return json({ ok: false, error: { code: error.code || "INTERNAL_ERROR", message: status === 503 ? "Enterprise persistence is not configured yet." : "Enterprise request failed." }, request_id: crypto.randomUUID() }, status);
  }
}
