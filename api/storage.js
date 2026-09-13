export class PersistenceNotConfiguredError extends Error {
  constructor() {
    super("Enterprise persistence is not configured.");
    this.name = "PersistenceNotConfiguredError";
    this.code = "PERSISTENCE_NOT_CONFIGURED";
  }
}

export function createStorage(env = {}) {
  // The adapter deliberately has no implicit database target. A future
  // implementation must receive an explicitly configured server-side adapter.
  if (!env.ENTERPRISE_STORAGE_ADAPTER) {
    return createFailClosedStorage();
  }

  throw new Error("Configured storage adapters are not implemented yet.");
}

function createFailClosedStorage() {
  const fail = async () => {
    throw new PersistenceNotConfiguredError();
  };

  return Object.freeze({
    getCompanyForUser: fail,
    updateCompany: fail,
    getAssistant: fail,
    upsertAssistant: fail,
    listKnowledge: fail,
    addKnowledge: fail,
    listChannels: fail,
    updateChannel: fail,
    getReadiness: fail,
    setReadinessCheck: fail,
  });
}
