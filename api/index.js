const VERSION = "0.1.0";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function requestId() {
  return crypto.randomUUID();
}

export default {
  async fetch(request) {
    const id = requestId();
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
          "access-control-allow-headers": "authorization,content-type",
        },
      });
    }

    const headers = {
      "access-control-allow-origin": "*",
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    };

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        service: "bitey-enterprise-api",
        version: VERSION,
        environment: "foundation",
        production_activation: false,
        database_connected: false,
        request_id: id,
      }), { status: 200, headers });
    }

    if (url.pathname === "/api/v1/readiness") {
      return new Response(JSON.stringify({
        ok: true,
        data: {
          state: "DRAFT",
          activation_allowed: false,
          checks: {
            authentication: false,
            tenant_isolation: false,
            persistence: false,
            assistant: false,
            knowledge: false,
            channels: false,
            security: true,
          },
        },
        request_id: id,
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({
      ok: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "This Enterprise API endpoint is not implemented yet.",
      },
      request_id: id,
    }), { status: 404, headers });
  },
};
