# Authentication and tenant boundary

Bitey Enterprise must resolve the tenant from the authenticated server-side identity.

## Rules

1. The browser must never select or assert its own `company_id` as an authorization boundary.
2. Authentication must be validated server-side.
3. The authenticated principal resolves to one or more memberships.
4. Every company, assistant, knowledge, channel, customer, conversation, and validation query must be scoped through an authorized membership.
5. Missing authentication returns `401`.
6. Missing authentication-provider or persistence configuration returns `503`.
7. Cross-tenant identifiers must not be accepted as proof of authorization.
8. Production activation remains disabled until authentication, persistence, tenant isolation, and readiness checks are implemented and tested.

## Current state

The API exposes fail-closed authentication and tenant endpoints. They do not issue identities, create memberships, or return tenant data yet.

No existing Bitey IA or BiteFixes database is selected by this document. A persistence target must be explicitly assigned before database migrations are created.
