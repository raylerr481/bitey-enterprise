function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function onRequest(context) {
  const requestId = crypto.randomUUID();

  // Never accept company_id from the browser as an authorization boundary.
  // The authenticated identity must resolve to the tenant server-side.
  return json({
    ok: false,
    error: {
      code: "TENANT_RESOLUTION_NOT_CONFIGURED",
      message: "Tenant resolution is unavailable until authentication and persistence are configured.",
    },
    request_id: requestId,
  }, 503);
}
