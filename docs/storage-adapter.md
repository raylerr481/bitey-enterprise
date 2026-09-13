# Enterprise storage adapter

The Web control plane uses an explicit server-side persistence adapter.

## Safety rules

1. No database target is inferred from an existing Bitey project.
2. No browser credential may provide privileged database access.
3. No `company_id` supplied by the browser is trusted for authorization.
4. The default adapter fails closed with `PERSISTENCE_NOT_CONFIGURED`.
5. A production adapter must enforce membership and tenant ownership for every operation.
6. Production records must never silently fall back to localStorage.
7. Activation remains blocked until persistence, authentication, tenant isolation, assistant, knowledge, channels, and security checks pass.

## Adapter boundary

The application expects these operations:

- `getCompanyForUser(userId)`
- `updateCompany(companyId, patch)`
- `getAssistant(companyId, assistantId)`
- `upsertAssistant(companyId, input)`
- `listKnowledge(companyId, assistantId)`
- `addKnowledge(companyId, assistantId, input)`
- `listChannels(companyId, assistantId)`
- `updateChannel(companyId, assistantId, channel, patch)`
- `getReadiness(companyId, assistantId)`
- `setReadinessCheck(companyId, assistantId, checkKey, result)`

A concrete database implementation will be added only after the Enterprise persistence target is explicitly selected and its security model is verified.
