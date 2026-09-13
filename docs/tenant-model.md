# Bitey Enterprise Tenant Model

## Goal

Bitey Enterprise is multi-tenant by design. A company is the primary isolation boundary. Users may belong to one or more companies according to the future membership model, but every protected resource is evaluated through an explicit company context.

## Core entities

### company

Represents a business workspace.

Suggested fields:

- `id`
- `name`
- `website`
- `location`
- `description`
- `status`
- `created_at`
- `updated_at`

### company_member

Associates an authenticated user with a company.

Suggested fields:

- `company_id`
- `user_id`
- `role`
- `status`
- `created_at`

Roles should be explicit, for example `owner`, `admin`, `operator`, and `viewer`.

### assistant

One or more dedicated assistants may belong to a company.

Suggested fields:

- `id`
- `company_id`
- `name`
- `role`
- `tone`
- `language`
- `greeting`
- `system_instructions`
- `business_rules`
- `handoff_policy`
- `lifecycle_state`
- `created_at`
- `updated_at`

### knowledge_source

Represents a source used to ground an assistant.

Suggested fields:

- `id`
- `company_id`
- `assistant_id`
- `source_type`
- `title`
- `uri_or_reference`
- `status`
- `content_hash`
- `last_validated_at`
- `created_at`
- `updated_at`

Provider credentials must never be stored in frontend code or local storage.

### channel_identity

Represents a channel binding for an assistant.

Suggested fields:

- `id`
- `company_id`
- `assistant_id`
- `channel_type`
- `external_identity`
- `status`
- `validation_status`
- `created_at`
- `updated_at`

Channel types can include `web`, `telegram`, and `whatsapp`. Provider secrets remain backend-only.

### customer

Represents an external person interacting with the company's assistant.

Suggested fields:

- `id`
- `company_id`
- `external_identity`
- `display_name`
- `metadata`
- `created_at`
- `updated_at`

### conversation

Represents an interaction thread.

Suggested fields:

- `id`
- `company_id`
- `assistant_id`
- `channel_identity_id`
- `customer_id`
- `status`
- `created_at`
- `updated_at`

Every conversation must be provably owned by the same company as its parent resources.

### validation

Stores deterministic validation results.

Suggested fields:

- `id`
- `company_id`
- `assistant_id`
- `check_type`
- `status`
- `message`
- `details`
- `created_at`

### entitlement

Defines what a company is allowed to use.

Suggested fields:

- `id`
- `company_id`
- `tier`
- `features`
- `limits`
- `status`
- `created_at`
- `updated_at`

Tiers such as Starter, Business, and Enterprise are configuration, not security logic embedded in frontend code.

## Isolation rules

The backend must enforce these invariants:

1. A user can access only companies for which membership is valid.
2. A company can access only its own assistants.
3. An assistant can access only knowledge sources belonging to its company.
4. A channel identity can be used only by its company and assistant.
5. A customer belongs to exactly one company context for a given tenant record.
6. A conversation's company, assistant, channel, and customer must agree.
7. Entitlements are resolved from the company context, never from a client-provided tier.
8. Administrative actions require role checks in addition to tenant checks.
9. Deleting or changing a parent resource must not permit access to another tenant's children.
10. IDs are identifiers, not authorization.

## Database/RLS requirements

If PostgreSQL/Supabase is selected for persistence, row-level security should be treated as defense-in-depth and implemented around the company membership boundary.

Conceptually:

```text
authenticated user
      |
      v
company_member
      |
      v
company_id
      |
      +--> assistant
      +--> knowledge_source
      +--> channel_identity
      +--> customer
      +--> conversation
      +--> validation
      +--> entitlement
```

Policies must deny by default and allow access only when the authenticated principal has the required company membership and role.

## Auditability

Security-sensitive mutations should create audit events, especially:

- assistant activation/deactivation;
- channel activation/deactivation;
- role changes;
- knowledge deletion;
- entitlement changes;
- readiness overrides;
- production configuration changes.

## Current implementation boundary

No specific database project is assumed by this document. The production persistence provider must be selected and connected explicitly before backend implementation. This prevents accidental modification of an unrelated BiteFixes or other project database.
