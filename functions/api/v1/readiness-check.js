const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  },
});

export async function onRequest() {
  return json({
    ok: false,
    error: {
      code: "PERSISTENCE_NOT_CONFIGURED",
      message: "Enterprise persistence is not configured.",
    },
  }, 503);
}
