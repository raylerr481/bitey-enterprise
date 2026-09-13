function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequestGet() {
  const checks = {
    authentication: false,
    tenant_isolation: false,
    persistence: false,
    assistant: false,
    knowledge: false,
    channels: false,
    security: true,
  };

  return json({
    ok: true,
    service: "bitey-enterprise-api",
    state: "DRAFT",
    activation_allowed: false,
    production_activation: false,
    checks,
    request_id: crypto.randomUUID(),
  });
}
