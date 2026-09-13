import { createSupabaseClient, getBearerToken, SupabaseNotConfiguredError, SupabaseRequestError } from "../../lib/supabase.js";
import { createStorage, PersistenceNotConfiguredError } from "../../lib/storage.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet(context) {
  const requestId = crypto.randomUUID();
  const token = getBearerToken(context.request);
  if (!token) {
    return json({ ok: false, error: { code: "AUTHENTICATION_REQUIRED", message: "Authentication is required." }, request_id: requestId }, 401);
  }

  try {
    const supabase = createSupabaseClient(context.env);
    const user = await supabase.getUser(token);
    if (!user) {
      return json({ ok: false, error: { code: "INVALID_AUTHENTICATION", message: "The authentication token is invalid or expired." }, request_id: requestId }, 401);
    }

    const storage = createStorage(context.env, token);
    const company = await storage.getCompanyForUser(user.id);
    if (!company?.id) {
      return json({ ok: false, error: { code: "TENANT_NOT_FOUND", message: "No Enterprise company is assigned to this user." }, request_id: requestId }, 404);
    }

    const assistant = await storage.getAssistant(company.id);
    if (!assistant?.id) {
      return json({ ok: false, error: { code: "ASSISTANT_NOT_FOUND", message: "No assistant is configured for this company." }, request_id: requestId }, 404);
    }

    const [knowledge, channels] = await Promise.all([
      storage.listKnowledge(company.id, assistant.id),
      storage.listChannels(company.id, assistant.id),
    ]);

    const checks = {
      authentication: true,
      tenant_isolation: true,
      persistence: true,
      assistant: Boolean(assistant.name && assistant.role && assistant.instructions),
      knowledge: knowledge.length > 0 && knowledge.every((item) => item.status === "ready"),
      channels: channels.length > 0 && channels.every((item) => item.enabled === true),
      security: true,
    };

    const state = Object.values(checks).every(Boolean) ? "READY" : "TESTING";
    const results = await Promise.all(
      Object.entries(checks).map(([checkKey, passed]) =>
        storage.setReadinessCheck(company.id, assistant.id, checkKey, {
          passed,
          details: { source: "server", evaluated_state: state },
          checked_at: new Date().toISOString(),
        })
      )
    );

    return json({
      ok: true,
      data: {
        state,
        activation_allowed: false,
        production_activation: false,
        checks,
        results,
      },
      request_id: requestId,
    });
  } catch (error) {
    const status = error instanceof PersistenceNotConfiguredError || error instanceof SupabaseNotConfiguredError
      ? 503
      : error instanceof SupabaseRequestError
        ? 502
        : 500;
    return json({
      ok: false,
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: status === 503
          ? "Enterprise persistence is not configured correctly yet."
          : status === 502
            ? "Enterprise readiness lookup failed."
            : "Enterprise readiness check failed.",
      },
      request_id: requestId,
    }, status);
  }
}
