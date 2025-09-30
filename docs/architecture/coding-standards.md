# Coding Standards

## General
- TypeScript everywhere; no `any` unless justified.
- Maintain strict ESLint + Prettier formatting; run `npm run lint` before commits.
- Follow domain-driven folder structure within `src/features/{domain}`.

## Server Actions & Services
- Validate all inputs via Zod schemas.
- Keep server actions thin; delegate logic to services.
- Use `async/await` with try/catch; log errors via `src/utils/logger`.
- Ensure Firestore writes are idempotent and backwards-compatible.

## React/Frontend
- Prefer Server Components; use Client components only when hooks/state required.
- Co-locate feature UI in `src/components/screens/` or `src/features/{domain}/components/`.
- Use Tailwind + Radix primitives; avoid inline styles.
- Provide loading/error states; follow feature flag gating for beta routes.

## Testing
- Unit tests in `src/features/{domain}/__tests__/` using Jest.
- Integration/e2e in `tests/integration/` using Playwright (or equivalent).
- Each story must list required tests; ensure coverage before marking complete.

## Observability & Flags
- Emit metrics using standardized logger namespaces.
- Gate new features via Remote Config/environment variables.
- Document rollout/rollback steps in architecture docs.
