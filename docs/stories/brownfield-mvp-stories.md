# Brownfield MVP Story Backlog

## Epic 1 — Personalized Feed & Discovery

### Story 1.1: Bootstrap Feed Infrastructure
- **Goal**: Create Firestore collections (`creations`, `feed_entries`) and API route `/api/feed` with cursor-based pagination.
- **Acceptance Criteria**:
  - Feed endpoint returns localized feed entries sorted by `rank_score` and `createdAt`.
  - Supports `cursor`, `limit`, `region`, `locale` query params.
  - Unit tests cover pagination + regional filters; Firestore security rules updated.
- **Dependencies**: Data model from architecture doc.

### Story 1.2: Infinite Scroll Home Feed UI
- **Goal**: Implement TikTok-style vertical feed page with optimistic engagement counters.
- **Acceptance Criteria**:
  - Mobile-first layout with auto-play previews (image loop/GIF) and skeleton placeholders <1s.
  - Pulls data via Story 1.1 endpoint, persists scroll position per session.
  - Supports quick actions: like, comment, share (stub API), CTA to sign in for interactions.
- **Dependencies**: Story 1.1.

### Story 1.3: Trending & Search Surface
- **Goal**: Add `/trending` and `/search` experiences driven by Firestore indexes.
- **Acceptance Criteria**:
  - Search bar queries `creations` on caption, tags, creator handle; returns results <500ms median.
  - Trending feed aggregates top creations in last 48h with > configurable threshold.
  - Analytics events instrumented (`feed_view`, `search_submit`).
- **Dependencies**: Story 1.1.

## Epic 2 — Creation Studio & AI Pipeline

### Story 2.1: Asset Upload & Prompt Capture
- **Goal**: Build Creation Studio step 1 for input collection.
- **Acceptance Criteria**:
  - Supports text-only, image+text, multi-image uploads (drag-drop/mobile).
  - Generates signed upload URLs to Storage; progress UI for uploads.
  - Persists draft creation doc with state `draft` linked to user.
- **Dependencies**: Auth flows, Storage.

### Story 2.2: AI Generation Orchestrator
- **Goal**: Implement Cloud Function that wraps nanobanana + Gemini per architecture.
- **Acceptance Criteria**:
  - Exposes `POST /api/creations/:id/generate` that triggers Genkit pipeline.
  - Pipeline logs prompt, variation metadata, stores outputs in `creation_assets` + Storage.
  - Handles status updates (`queued`, `rendering`, `complete`, `failed`) with Firestore listeners.
  - Includes retries, timeout handling, unit/integration tests on mocked services.
- **Dependencies**: Story 2.1.

### Story 2.3: Creation Publish Flow
- **Goal**: Allow users to select variants, add captions, tags, product template, and publish.
- **Acceptance Criteria**:
  - UI lists generated variants with preview + metadata; user selects primary variant.
  - Publishing moves doc to `published` status, triggers moderation webhook and feed entry creation.
  - Feed updates available within 5s; success toast + share CTA.
- **Dependencies**: Story 2.2, Story 4.2.

## Epic 3 — Commerce & Checkout

### Story 3.1: Product Template Service
- **Goal**: Define product template data model and admin tool to manage catalog.
- **Acceptance Criteria**:
  - `products` collection stores SKU metadata, attribute matrices, pricing rules.
  - Admin UI (basic) allows create/update templates, restricted to role `admin`.
  - Validation prevents invalid combinations; tests cover CRUD + security.
- **Dependencies**: Admin auth.

### Story 3.2: Cart & Pricing API
- **Goal**: Provide cart persistence and pricing engine.
- **Acceptance Criteria**:
  - `/api/cart` supports add/update/remove line items referencing creation variant + product options.
  - Pricing service applies base price + add-ons; returns localized currency totals.
  - Guest carts stored by anonymous session token; registered carts tied to user.
- **Dependencies**: Story 3.1.

### Story 3.3: Payment & Checkout Flow
- **Goal**: Integrate Stripe + PayPal + regional gateway (stub) with checkout UI.
- **Acceptance Criteria**:
  - Checkout page collects shipping/billing (respecting locale), calculates shipping via aggregator sandbox.
  - Supports Apple Pay/Google Pay on compatible devices; fallback to card/paypal forms.
  - Successful payment creates `orders` doc with fulfillment status `pending`; failure rolls back cart.
  - Webhooks update order status; email confirmation sent.
- **Dependencies**: Story 3.2.

## Epic 4 — Social, Notifications & Engagement

### Story 4.1: Social Graph & Follow Mechanics
- **Goal**: Implement follow/unfollow endpoints and data model.
- **Acceptance Criteria**:
  - `/api/social/follow` persists follow edge, updates counters atomically.
  - Security ensures only authenticated users follow; prevents duplicates.
  - Feed personalization (Story 1.1) filters to followed creators when toggled.
- **Dependencies**: Story 1.1.

### Story 4.2: Engagement APIs (Like, Comment, Remix)
- **Goal**: Provide CRUD endpoints for likes/comments/remix with moderation hooks.
- **Acceptance Criteria**:
  - Likes update counters idempotently; comments saved with threaded structure.
  - Remix action creates draft creation referencing original id (for attribution).
  - Firestore rules enforce auth, rate limits; analytics events emitted.
- **Dependencies**: Story 4.1.

### Story 4.3: Notification Inbox
- **Goal**: Build server + UI for notifications (follows, comments, order updates).
- **Acceptance Criteria**:
  - Notification service writes to `notifications` collection; Cloud Function consolidates duplicates.
  - Inbox UI groups by category, marks read/unread, supports pagination.
  - Push/email notifications wired via Firebase Cloud Messaging + transactional email provider.
- **Dependencies**: Stories 4.1, 4.2, 3.3.

## Epic 5 — Moderation, Safety & Admin Dashboards

### Story 5.1: Automated Moderation Pipeline
- **Goal**: Integrate content safety scanning on publish.
- **Acceptance Criteria**:
  - Cloud Function triggers on `creations` publish, calls external moderation API, sets status (`approved`, `auto-flagged`).
  - Flags write to `moderation_flags` with reason scores; severe cases immediately hide content.
  - Logging + alerting for failures; allow manual override.
- **Dependencies**: Story 2.3.

### Story 5.2: Moderator Console
- **Goal**: Admin UI to review flagged content and user reports.
- **Acceptance Criteria**:
  - Table view with filters (severity, age, region); detail view shows assets, prompts, history.
  - Actions: approve, reject (with reason), escalate. Updates propagate to feed within 5s.
  - Audit log stored in `admin_metrics`.
- **Dependencies**: Story 5.1.

### Story 5.3: Analytics Dashboard MVP
- **Goal**: Provide key metrics (DAU, session length, creations/day, conversion, GMV).
- **Acceptance Criteria**:
  - Export Firestore events to BigQuery; scheduled queries populate aggregates.
  - Admin dashboard visualizes charts using analytics library (e.g., Recharts) with date filters.
  - Alerts configured for KPI anomalies (e.g., drop in conversions >20%).
- **Dependencies**: Telemetry instrumentation from prior stories.

## Implementation Notes
- Execute epics sequentially (1 → 2 → 3 → 4 → 5) while overlapping where teams allow.
- Maintain feature flags for each epic to support staged rollout and rollback.
- Each story must include Firestore security rule updates, TypeScript types, unit tests, and integration tests as applicable.
- Coordinate with legal/compliance before enabling production payments and user-generated merchandise.

