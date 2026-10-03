# {{project_name}} — Multi-tenant B2B SaaS

**Template:** saas-b2b
**Created:** {{date}}

## What we're building
_(One-sentence description — edit me.)_

A multi-tenant B2B SaaS for {{target_customer}} that solves {{core_problem}}. Paying customers are organizations, not individuals.

## Target customer
- **Segment:** {{segment}} (e.g. mid-market ops teams, compliance-heavy industries)
- **Size:** {{company_size}}
- **Buying trigger:** {{trigger}}

## Why now
_(Market timing, regulatory shift, technology enabler, etc.)_

## Monetization
- **Model:** Subscription (per-seat / per-org / usage-based — pick one)
- **Target ACV:** {{acv}}
- **Trial strategy:** {{trial_length}} with {{trial_gating}}

## Non-negotiables
- Data isolation between tenants (hard requirement, not best-effort)
- Audit log for every mutating action (for SOC2/ISO compliance paths)
- SSO support by launch (SAML or OIDC — most B2B buyers require this)

## Explicitly out of scope
- Consumer tier
- Self-serve free plan beyond trial
- Mobile apps in v1

## Key risks
- **Technical:** multi-tenancy bugs = data leak = company-ending event
- **Business:** long B2B sales cycles may outlast runway
- **Regulatory:** PII/data-residency constraints depending on target market

## Evolution
_(Updated after each phase completion by `/rihal:execute`.)_
