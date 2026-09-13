# Bitey Enterprise Backend Contract

## Scope

This document defines the first backend contract for the Bitey Enterprise web control plane. The web application is a tenant-aware configuration UI. Production activation must remain disabled until authentication, authorization, persistence, validation, and channel controls are implemented server-side.

## API principles

- The browser never receives privileged database credentials.
- Every protected request is evaluated in the authenticated user's tenant context.
- `company_id` is server-derived from the authenticated principal whenever possible; clients must not be trusted to select another tenant.
- `assistant_id`, `channel_identity_id`, `customer_id`, and `conversation_id` are validated against the same `company_id`.
- Unknown knowledge must not be presented as fact.
- Channel activation is a server-side operation and cannot be enabled by a UI toggle alone.
- Production and real-user activation require readiness checks to pass.

## Resource model

Core resources:

- `company`
- `assistant`
- `knowledge_source`
- `channel_identity`
- `customer`
- `conversation`
- `validation`
- `entitlement`

Logical ownership:

```text
user
  |
  v
company
  |
  +--> assistant
  |      |
  |      +--> knowledge_source
  |      +--> channel_identity
  |      +--> validation
  |
  +--> customer
         |
         +--> conversation

company --> entitlement
```

## Identity chain

The canonical isolation chain is:

```text
user_id
  -> company_id
  -> assistant_id
  -> channel_identity_id
  -> customer_id
  -> conversation_id
```

A resource must never be resolved only by an ID supplied by the browser. The backend must verify ownership or membership at every boundary.

## Suggested REST endpoints

### Company

`GET /api/v1/company`

Returns the authenticated user's active company.

`PUT /api/v1/company`

Updates allowed company profile fields.

Example request:

```json
{
  "name": "Example Business",
  "website": "https://example.com",
  "location": "Brazil",
  "description": "Business description"
}
```

### Assistant

`GET /api/v1/assistant`

Returns the company's configured assistant.

`PUT /api/v1/assistant`

Updates identity and behavior configuration.

Supported configuration includes name, role, tone, language, greeting, system instructions, business rules, escalation behavior, and activation state.

### Knowledge

`GET /api/v1/knowledge/sources`

Lists knowledge sources belonging to the company.

`POST /api/v1/knowledge/sources`

Creates a source record. Ingestion must happen server-side.

`DELETE /api/v1/knowledge/sources/{source_id}`

Deletes a source only after tenant ownership is verified.

Supported source classes may include URL, PDF, DOCX, TXT, CSV, FAQ, catalog, policy, and manual entry.

### Channels

`GET /api/v1/channels`

Lists channel identities and their server-side status.

`POST /api/v1/channels`

Creates a channel configuration without exposing provider secrets to the browser.

`POST /api/v1/channels/{channel_id}/validate`

Runs provider/configuration validation.

`POST /api/v1/channels/{channel_id}/activate`

Activates a channel only when readiness and security requirements pass.

### Customers and conversations

`GET /api/v1/customers`

Lists customers scoped to the company.

`GET /api/v1/customers/{customer_id}`

Returns a company-scoped customer.

`GET /api/v1/conversations/{conversation_id}`

Returns a conversation only when its customer and company ownership are valid.

### Readiness

`GET /api/v1/readiness`

Returns the current readiness state and individual checks.

`POST /api/v1/readiness/validate`

Runs deterministic server-side validation.

Suggested lifecycle:

```text
DRAFT -> CONFIGURING -> TESTING -> READY -> ACTIVE
                         |
                         v
                    NEEDS_REVIEW
```

`ACTIVE` must be unreachable when required checks fail.

## Standard response envelope

Success responses should be predictable and machine-readable:

```json
{
  "ok": true,
  "data": {},
  "request_id": "request-id"
}
```

Error responses should avoid leaking secrets or internal stack traces:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The assistant configuration is incomplete."
  },
  "request_id": "request-id"
}
```

## Readiness minimum checks

Before production activation, the backend should verify at least:

1. authenticated user exists;
2. company membership is valid;
3. assistant identity is complete;
4. business instructions are present;
5. knowledge sources are valid or explicitly marked optional;
6. channel configuration is valid;
7. secrets are stored only server-side;
8. tenant isolation tests pass;
9. escalation/human handoff policy is configured;
10. entitlement permits the requested activation;
11. validation status is current;
12. no blocking security issue exists.

## Explicit non-goals for this phase

- No production channel secrets in the browser.
- No privileged database access from frontend JavaScript.
- No automatic paid provider activation.
- No dependency on BiteFixes backend without an explicit API contract.
- No dependency on the Android repository.
- No dependency on SBT or JobIA unless a later integration contract explicitly defines it.

## Backend implementation order

1. Authentication and company membership.
2. Tenant-safe persistence.
3. Company and assistant CRUD.
4. Knowledge source persistence and server-side ingestion pipeline.
5. Channel configuration and validation.
6. Customers and conversations.
7. Readiness engine.
8. Entitlement enforcement.
9. Audit events.
10. Production activation controls.
