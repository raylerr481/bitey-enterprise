# Bitey Enterprise persistence contract

## Scope

This contract defines the storage boundary for Bitey Enterprise without selecting or modifying an existing production database.

The Enterprise Web control plane owns its company-scoped records: companies, memberships, assistants, knowledge sources, channel identities, customers, conversations, readiness checks, and entitlements.

## Tenant boundary

The authenticated server identity resolves membership and therefore the `company_id`. The browser must never be trusted to choose a tenant for authorization.

Every tenant-owned record must be validated through its parent company membership before read, update, or delete.

## Storage adapter requirements

The backend adapter must expose operations equivalent to:

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

Adapters must fail closed when persistence is not configured. They must never silently fall back to browser localStorage for production records.

## Database target

The SQL in `docs/sql/001_enterprise_core.sql` is an **unapplied** schema reference. It may be used to provision a clean Enterprise database after an explicit target is selected.

No existing Bitey IA, BiteFixes, SBT, or other database is implicitly authorized by this contract.

## Lifecycle

Persistence must support the assistant lifecycle:

`DRAFT → CONFIGURING → TESTING → READY → ACTIVE`

Validation failures may move an assistant to `NEEDS_REVIEW`.

`ACTIVE` must not be granted merely because a UI button was pressed. The server must verify authentication, tenant isolation, persistence health, assistant configuration, knowledge readiness, channel configuration, and security requirements before activation.

## Secrets

Privileged database credentials and provider secrets remain server-side. The Web application receives only scoped application responses.
