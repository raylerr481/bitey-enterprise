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
  return json({
    ok: true,
    service: "bitey-enterprise-api",
    version: "0.1.0",
    environment: "foundation",
    production_activation: false,
    database_connected: false,
    request_id: crypto.randomUUID(),
  });
}
