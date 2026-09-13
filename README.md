# Bitey Enterprise

**Bitey Enterprise** is the web control plane for provisioning, configuring, testing, and operating personalized AI assistants for businesses.

It is part of the Bitey ecosystem and is intentionally separated from the Android application repository.

## Ecosystem architecture

Bitey Enterprise does **not** create a separate cognitive brain or a parallel ecosystem memory system.

The architecture is centered on two existing GitHub systems and one shared Supabase persistence layer:

- **`raylerr481/bitey-web` — Bitey IA Web:** the **central cognitive brain** of Bitey IA.
- **`raylerr481/bitefixes-backend` — BiteFixes Backend:** the **specialized Bitey IA Empresarial** and authoritative BiteFixes business/API backend.
- **`bitefixes-backed` — Supabase/Postgres:** the **single shared canonical memory/data instance** for the Bitey/BiteFixes architecture.

```text
                         BITEY IA ECOSYSTEM
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
          Bitey IA Web / GitHub        BiteFixes Backend / GitHub
          CENTRAL COGNITIVE BRAIN      SPECIALIZED ENTERPRISE AI
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                         shared contracts
                                  │
                                  ▼
                     Supabase/Postgres
                       `bitefixes-backed`
                  SINGLE MEMORY / DATA LAYER
                                  │
                                  ▼
                         Bitey Enterprise
                         business control plane
```

### Project separation

- **`bitey-enterprise`** — Web application and business control plane. Target: Cloudflare Pages.
- **`bitey-enterprise-app`** — Android/mobile application (Expo/React Native). This repository remains Android-focused.
- **`bitey-web`** — Central/general Bitey IA cognitive brain.
- **`bitefixes-backend`** — Specialized BiteFixes enterprise AI/business backend.
- **`bitey-system-bots-trading`** — Bitey SBT trading module; independent from Bitey Enterprise business data.
- **`JobIA`** — Job intelligence and matching module.

Bitey Enterprise must integrate through explicit contracts. It must not duplicate the central brain, create a parallel Supabase memory system, or modify unrelated operational systems implicitly.

## Purpose

Bitey Enterprise provides a business-facing workspace where an organization can:

1. Create and configure a business profile.
2. Provision a dedicated AI assistant.
3. Define the assistant's identity, personality, tone, languages, role, and instructions.
4. Add business knowledge and operational rules.
5. Configure channels such as Web, Telegram, and WhatsApp.
6. Test behavior and knowledge before activation.
7. Monitor readiness and activate the assistant only when required checks pass.

The assistant is a first-class business resource rather than a generic chatbot configuration.

## Cognitive and enterprise responsibilities

**Bitey IA Web** provides the central/general cognitive capabilities: reasoning, planning, general context, memory access, model/tool orchestration, evaluation, policies and coordination of specialized capabilities.

**BiteFixes Backend** provides the specialized enterprise/business layer: BiteFixes CRM, SaaS, tenant operations, business APIs, AI-agent implementation and contextual Bitey IA Empresarial behavior.

**Bitey Enterprise** is the business control plane used to configure, validate and manage enterprise assistant resources. It does not replace either intelligence layer.

## Shared memory and data

**`bitefixes-backed` is the single canonical Supabase/Postgres memory/data instance for the Bitey IA Web and BiteFixes Backend architecture.**

Bitey Enterprise must integrate with this architecture through secure backend/API contracts. It must not introduce another Supabase project solely for duplicate ecosystem memory.

Tenant and domain isolation remain mandatory even though the canonical persistence platform is shared.

## Assistant model

Each assistant can contain:

- Name and avatar/branding
- Greeting and conversation style
- Languages and tone
- Business role
- System instructions
- Business rules
- Escalation and human-handoff policy
- Knowledge sources
- Services and products
- Channel configuration
- Memory and conversation context
- Entitlements/capabilities
- Validation tests
- Activation state

## Knowledge layer

Supported knowledge sources are designed to include:

- Websites
- PDF
- DOCX
- TXT
- CSV
- FAQs
- Product catalogs
- Policies
- Manuals
- Manually entered business information

The knowledge pipeline should extract structured business facts such as products, services, prices, schedules, locations, policies, FAQs, contact information, and terminology.

The assistant should prefer grounded business knowledge, avoid inventing unavailable information, and escalate to a human when the requested information cannot be established reliably.

## AI readiness lifecycle

The intended lifecycle is:

`DRAFT → CONFIGURING → TESTING → READY → ACTIVE`

`NEEDS_REVIEW` is used when validation identifies an issue that must be resolved before activation.

Activation should be controlled by explicit readiness checks rather than by simply completing a form.

## Multichannel architecture

The target channels are:

- Web
- Telegram
- WhatsApp

All supported channels should resolve through the same assistant identity, business context, knowledge rules, and tenant isolation model.

Core identity boundaries:

`company_id → assistant_id → channel_identity → customer_identity → conversation_identity`

Cross-tenant access must be prevented at every layer.

## Entitlements

Capabilities are represented through configurable entitlement tiers rather than hard-coded assumptions. The initial model can support Starter, Business, and Enterprise while allowing future changes without rewriting assistant logic.

## Web application

The web application is intentionally lightweight and can be served as a static application from the `web/` directory.

Expected structure:

```text
bitey-enterprise/
├── web/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── auth.js
│   ├── api.js
│   ├── _headers
│   ├── _redirects
│   └── 404.html
├── functions/
│   └── api/v1/
├── docs/
├── README.md
└── wrangler.toml
```

### Cloudflare Pages target

The deployment target is **Cloudflare Pages**, publishing the `web/` directory while keeping the Pages Functions `functions/` directory at the project root.

Deployment configuration should remain compatible with the free Cloudflare Pages offering wherever practical. No paid service or automatic billing commitment should be introduced without explicit approval.

## Security principles

- Strict tenant isolation
- Least-privilege access
- No privileged database credentials in browser code
- Explicit activation/readiness gates
- Safe handling of uploaded knowledge
- Human escalation for uncertain or unsupported business facts
- Channel identities scoped to the correct assistant and company
- No secrets committed to the repository
- Shared Supabase access must remain protected by authenticated contracts and RLS
- Enterprise must not bypass the central cognitive/business backend boundaries

## Relationship to BiteFixes

BiteFixes remains the specialized enterprise domain and must not be modified as part of normal Bitey Enterprise development. Integration with BiteFixes Backend must use a defined backend/API contract.

Bitey Enterprise is therefore a control plane, not a replacement for `bitefixes-backend` and not a replacement for the central `bitey-web` cognitive brain.

## Development direction

The implementation should progress in this order:

1. Stable web shell and navigation.
2. Secure authentication and tenant resolution.
3. Integration with the central Bitey/BiteFixes backend architecture.
4. Business and assistant provisioning model.
5. Assistant configuration and personalization.
6. Knowledge ingestion and validation.
7. Channel configuration.
8. Testing and AI readiness checks.
9. Production activation controls.

## Status

**Web control-plane repository initialized and deployed to Cloudflare Pages.**

Production integrations and activation should remain disabled until their corresponding backend, security, tenant-isolation, shared-memory, and validation mechanisms are actually implemented and verified.

## License

License to be defined as the project moves toward public distribution.
