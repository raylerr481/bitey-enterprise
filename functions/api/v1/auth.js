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
  const authorization = context.request.headers.get("authorization");

  if (!authorization) {
    return json({
      ok: false,
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Authentication is required.",
      },
      request_id: requestId,
    }, 401);
  }

  return json({
    ok: false,
    error: {
      code: "AUTH_PROVIDER_NOT_CONFIGURED",
      message: "Authentication provider validation is not configured yet.",
    },
    request_id: requestId,
  }, 503);
}
