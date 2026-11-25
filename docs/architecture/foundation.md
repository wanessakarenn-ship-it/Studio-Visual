# Foundation — ADR 001

Accepted for initial development: structured versioned page documents, React renderer, Zod validation and local browser persistence. This is a single-page prototype, not a multi-tenant SaaS. No backend, publishing, drag-and-drop, nested elements, independent preview or static export yet. Button actions are not implemented. The schema will evolve through explicit migrations. No corporate code or assets reused. Dependency lockfile is committed and reproducible CI passed at 6f52916. Run npm ci, npm test, npm run build, npm run dev. Node 22 recommended.

Application directory: apps/studio. Legacy v1 storage key and behavior are unchanged.
