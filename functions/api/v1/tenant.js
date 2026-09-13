function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequest() {
  return json({
    ok: false,
    error: {
      code: "TENANT_RESOLUTION_NOT_CONFIGURED",
      message: "Tenant resolution is unavailable until authentication and persistence are configured.",
    },
    request_id: crypto.randomUUID(),
  }, 503);
}
