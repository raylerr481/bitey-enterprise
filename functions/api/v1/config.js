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
  const url = String(context.env.SUPABASE_URL || "").replace(/\/$/, "");
  const publishableKey = context.env.SUPABASE_PUBLISHABLE_KEY || context.env.SUPABASE_ANON_KEY || "";
  if (!url || !publishableKey) {
    return json({ ok: false, error: { code: "SUPABASE_NOT_CONFIGURED", message: "Authentication provider is not configured yet." } }, 503);
  }
  return json({ ok: true, data: { supabase_url: url, publishable_key: publishableKey } });
}
