# Studio Tracking & UTM

Status: architectural proposal, not implemented or homologated. Independent of corporate systems and assets.

## Features
- UTM builder: destination HTTP(S) URL, source, medium, campaign, id, content, term; preserve unrelated query parameters and fragments; replace selected UTM keys; encode values.
- Campaign manager: tenant-scoped CRUD, immutable revision history, naming conventions, bulk import/export, copy links. Editing a saved link does not retroactively change distributed URLs.
- Site editor: project-level tracking settings, per-page and outbound-link UTM overrides, preview, explicit allowlist for cross-domain propagation; no automatic propagation to arbitrary external sites.
- Attribution: first and last eligible touch, timestamps, landing page, referrer, campaign IDs; direct visits do not overwrite last non-direct touch by default. Consent-aware persistence and configurable retention.
- Debugger: capture, persistence, consent, form mapping, server acknowledgement and CRM acknowledgement shown separately; never infer downstream delivery from browser capture.
- Analytics: campaign dimensions, conversion events, deduplication, lead attribution, aggregate reports.
- Integrations: generic CRM adapter, authenticated webhooks, idempotency, retries and redacted logs.

## Security and privacy
Tenant isolation, server-side authorization, audit log, URL protocol validation, no secrets or personal data in UTMs. Respect consent settings and LGPD requirements; do not store click identifiers before applicable consent. Restrict debugger to authorized editor users or explicit development preview. Avoid open redirects and script injection.

## Acceptance
Test URL encoding, duplicate keys, fragments, invalid schemes, consent denial, direct visits, cross-domain allowlist, form payload mapping, server acknowledgements, tenant isolation, and published page parity. No claims of CRM delivery without evidence. No cloud provisioning or deployment in this phase.

## Delivery order
1. Pure URL builder and unit tests.
2. Editor panel and saved campaign contracts.
3. Tenant persistence and revision history.
4. Consent-aware runtime and debugger.
5. Forms, leads, analytics and CRM adapters.
6. Integrated browser and security tests.
