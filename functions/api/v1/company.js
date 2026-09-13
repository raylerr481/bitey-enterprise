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
      code: "PERSISTENCE_NOT_CONFIGURED",
      message: "Company persistence and tenant authentication are not configured yet.",
    },
    request_id: crypto.randomUUID(),
  }, 503);
}
