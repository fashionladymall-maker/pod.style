# Changelog

## Unreleased

- Introduce moderation pipeline with Cloud Functions text/image checks, client precheck gating, and moderation record APIs for compliance (M4-COMPLIANCE-001).
- Resolve TypeScript schema drift by expanding shared OMG types (comments, follows, orders, notifications), unifying legacy comment usage, and cleaning test helpers that conflicted with global declarations (M4-TYPEFIX-001).
- Wire order placement to render queue tasks, bind print assets to order items, and expose download/factory HTTP endpoints for fulfillment integrations (M3-RENDER-002).
- Implement Cloud Tasks-driven print-ready rendering with Sharp/pdfkit, Storage uploads, and Firestore `printAsset` updates for 300 DPI TIFF/PDF outputs (M3-RENDER-001).
- Add flat-config `eslint.config.js` so `npm run lint` succeeds (M0-FIX-002).
- Fix TypeScript errors across OMG UI components and feed tests for story M0-FIX-001.
- Implement vertical OMG feed MVP with virtualized scrolling, Functions-backed preview overlays, and upgraded carousel/action bar interactions (M1-FEED-001).
- Deliver commerce flow for SKU detail, cart, checkout, and Stripe payments including Firebase Functions webhook + Jest coverage for cart/checkout utilities (M2-COMMERCE-001).
- Document Stripe environment setup and add API contract tests covering payment intent creation and order placement flows (M2-COMMERCE-001).
- Optimize OMG performance (M4-PERFORMANCE-001): adopt Next.js Image placeholders, lazy-load modal/drawer bundles, enable Firestore persistence, enhance service-worker caching, and capture generation latency metrics.
