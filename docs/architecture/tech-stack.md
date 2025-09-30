# Tech Stack Overview

## Frontend
- Framework: Next.js 15 (App Router) with Turbopack for development
- Runtime: React 18 with TypeScript and TailwindCSS
- UI Libraries: Radix UI primitives, lucide-react icons, shadcn/ui components
- State & Data Hooks: Custom context providers (AuthProvider), useToast, suspense streams

## Backend & Services
- Authentication: Firebase Authentication (anonymous login + email/password)
- Data Storage: Cloud Firestore (core collections for creations, orders, caches, social graph)
- File Storage: Firebase Storage / Cloudflare R2 for media assets
- Functions: Firebase Cloud Functions (scheduled jobs, moderation, feed cache)
- AI Pipeline: Genkit flows invoking Google Gemini + nanobanana integrations

## Infrastructure & Tooling
- Hosting: Firebase App Hosting
- Task Queue: Cloud Functions v2 / Cloud Run with Pub/Sub, Cloud Tasks (planned)
- Observability: OpenTelemetry → Cloud Logging/Error Reporting, BigQuery exports
- CI/CD: Firebase CLI deploy scripts; planned GitHub Actions automation
- Testing: Jest + ts-jest for unit tests, Playwright or Cypress for integration, Firebase Emulator Suite

## Dev Workflow Basics
- Node.js >= 20, npm or pnpm
- Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck`
- Feature flags via Remote Config/environment variables (e.g., `NEXT_PUBLIC_ENABLE_FEED_BETA`)
