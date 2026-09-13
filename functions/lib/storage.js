import { createSupabaseClient, SupabaseRequestError } from "./supabase.js";

export class PersistenceNotConfiguredError extends Error {
  constructor() {
    super("Enterprise persistence is not configured.");
    this.name = "PersistenceNotConfiguredError";
    this.code = "PERSISTENCE_NOT_CONFIGURED";
  }
}

export function createStorage(env = {}, accessToken = null) {
  const supabase = createSupabaseClient(env);
  if (!accessToken) throw new PersistenceNotConfiguredError();

  async function parse(response) {
    if (response.ok) return response.status === 204 ? null : response.json();
    const body = await response.text();
    throw new SupabaseRequestError(response.status, body);
  }

  async function one(table, query) {
    const response = await supabase.rest(table, `?${query}`, {}, accessToken);
    const rows = await parse(response);
    return Array.isArray(rows) ? (rows[0] || null) : rows;
  }

  async function many(table, query) {
    const response = await supabase.rest(table, `?${query}`, {}, accessToken);
    const rows = await parse(response);
    return Array.isArray(rows) ? rows : [];
  }

  async function write(table, method, body, query = "", prefer = "return=representation") {
    const response = await supabase.rest(table, query ? `?${query}` : "", {
      method,
      headers: { "content-type": "application/json", Prefer: prefer },
      body: JSON.stringify(body),
    }, accessToken);
    return parse(response);
  }

  async function companyForUser(userId) {
    if (!userId) throw new PersistenceNotConfiguredError();
    const membership = await one("company_members", `user_id=eq.${encodeURIComponent(userId)}&select=company_id&order=created_at.asc&limit=1`);
    if (!membership) return null;
    return one("companies", `id=eq.${encodeURIComponent(membership.company_id)}&select=*`);
  }

  async function getAssistant(companyId, assistantId = null) {
    const query = assistantId
      ? `company_id=eq.${encodeURIComponent(companyId)}&id=eq.${encodeURIComponent(assistantId)}&select=*`
      : `company_id=eq.${encodeURIComponent(companyId)}&select=*&order=created_at.asc&limit=1`;
    return one("assistants", query);
  }

  return Object.freeze({
    getCompanyForUser: companyForUser,
    updateCompany: (companyId, patch) => write("companies", "PATCH", patch, `id=eq.${encodeURIComponent(companyId)}`),
    getAssistant,
    upsertAssistant: (companyId, input) => write("assistants", "POST", { ...input, company_id: companyId }, "on_conflict=company_id,id", "return=representation,resolution=merge-duplicates"),
    listKnowledge: (companyId, assistantId) => many("knowledge_sources", `company_id=eq.${encodeURIComponent(companyId)}&assistant_id=eq.${encodeURIComponent(assistantId)}&select=*&order=created_at.desc`),
    addKnowledge: (companyId, assistantId, input) => write("knowledge_sources", "POST", { ...input, company_id: companyId, assistant_id: assistantId }),
    listChannels: (companyId, assistantId) => many("channel_identities", `company_id=eq.${encodeURIComponent(companyId)}&assistant_id=eq.${encodeURIComponent(assistantId)}&select=*&order=created_at.asc`),
    updateChannel: (companyId, assistantId, channel, patch) => write("channel_identities", "PATCH", patch, `company_id=eq.${encodeURIComponent(companyId)}&assistant_id=eq.${encodeURIComponent(assistantId)}&channel=eq.${encodeURIComponent(channel)}`),
    getReadiness: (companyId, assistantId) => many("readiness_checks", `company_id=eq.${encodeURIComponent(companyId)}&assistant_id=eq.${encodeURIComponent(assistantId)}&select=*&order=check_key.asc`),
    setReadinessCheck: (companyId, assistantId, checkKey, result) => write("readiness_checks", "POST", { company_id: companyId, assistant_id: assistantId, check_key: checkKey, ...result }, "on_conflict=company_id,assistant_id,check_key", "return=representation,resolution=merge-duplicates"),
  });
}
