# {{project_name}} — API Backend

**Template:** api-backend
**Created:** {{date}}

## What we're building
A headless API for {{use_case}}. Consumers are other services, internal apps, or third-party integrations — not end users directly.

## API surface
- **Protocol:** REST / GraphQL / gRPC — pick one, justify in an ADR
- **Versioning strategy:** {{versioning}} (URL-prefix vs header vs dated)
- **Auth:** API keys + scoped tokens

## Primary consumers
- {{consumer_1}}
- {{consumer_2}}

## Performance targets
- p50 latency: {{p50}} · p95: {{p95}} · p99: {{p99}}
- Throughput: {{rps}} req/s sustained
- Availability: {{slo}}

## Non-negotiables
- Every endpoint is idempotent or explicitly documented as non-idempotent
- Breaking changes ship under a new version — never mutate existing endpoints
- Errors follow a consistent schema (code, message, request_id)

## Explicitly out of scope
- Frontend / dashboards (separate project)
- Self-serve signup UI

## Key risks
- Scope drift into full-product features → resist
- Early API shape locks in; expensive to change once consumers integrate

## Evolution
_(Updated after each phase completion by `/rihal:execute`.)_
