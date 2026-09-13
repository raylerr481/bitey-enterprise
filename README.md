# Bitey Enterprise

**Bitey Enterprise** is the web control plane for provisioning, configuring, testing, and operating personalized AI assistants for businesses.

It is part of the Bitey ecosystem and is intentionally separated from the Android application repository.

## Project separation

- **`bitey-enterprise`** — Web application and business control plane. Target: Cloudflare Pages.
- **`bitey-enterprise-app`** — Android/mobile application (Expo/React Native). This repository remains Android-focused.
- **`bitey-web`** — General Bitey AI experience; independent from Bitey Enterprise and BiteFixes.
- **`bitey-system-bots-trading`** — Bitey SBT trading module; independent from Bitey Enterprise.
- **`JobIA`** — Job intelligence and matching module.

Bitey Enterprise must not modify or depend on the private operational context of unrelated Bitey modules unless an explicit integration contract is defined.

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
│   ├── _headers
│   ├── _redirects
│   └── 404.html
├── docs/
├── README.md
└── wrangler.toml
```

### Cloudflare Pages target

The intended deployment target is **Cloudflare Pages**, publishing the `web/` directory without an unnecessary build step.

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

## Relationship to BiteFixes

Bitey Enterprise is a reusable business product/control plane. **BiteFixes remains a separate system and must not be modified as part of normal Bitey Enterprise development.** Any future BiteFixes integration must be explicit and use a defined backend/API contract.

## Development direction

The implementation should progress in this order:

1. Stable web shell and navigation.
2. Business and assistant provisioning model.
3. Assistant configuration and personalization.
4. Knowledge ingestion and validation.
5. Channel configuration.
6. Testing and AI readiness checks.
7. Secure backend integration.
8. Production activation controls.

The current priority is to establish the independent Web application in this repository while keeping the Android application repository separate.

## Status

**Web control-plane repository initialized.**

The repository is currently the dedicated home for Bitey Enterprise Web. Production integrations and activation should remain disabled until their corresponding backend, security, tenant-isolation, and validation mechanisms are actually implemented.

## License

License to be defined as the project moves toward public distribution.
