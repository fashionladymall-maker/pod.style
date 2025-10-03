# PRD — Pod.Style Social Commerce Rebuild (Brownfield)

## 1. Vision & Summary
Rebuild Pod.Style into an OMG-like social commerce platform where users rapidly turn creative ideas into purchasable products. Users can browse an infinite feed of community creations, generate AI-powered product mockups (via nanobanana + Gemini), and check out in one tap. The experience must feel familiar to short-form content platforms while retaining ecommerce reliability.

## 2. Goals & KPIs
- Launch an MVP within 1–4 weeks that supports anonymous browsing, creative generation, and checkout.
- Track and improve:
  - Daily active users (DAU) across US/EU/Middle East cohorts
  - Average session duration & scroll depth (content engagement)
  - Number of AI-generated creations per user
  - Conversion to cart & purchase (overall + per cohort)
  - Gross merchandise value (GMV) and repeat purchase rate
  - Content safety signals (flag rate, manual moderation load)

## 3. Target Users & Personas
- **Guest Browsers**: Anonymous visitors exploring trending creations, can favorite/share but must sign up to create or purchase.
- **Registered Creators**: Authenticated users who publish creations, interact socially, generate mockups, and place orders.
- **Influencers/Brands**: Verified accounts with advanced analytics, bulk upload, collaboration tools.
- **Moderators/Admins**: Internal staff managing content safety, fulfillment, and dashboards.

## 4. Key User Journeys
1. **Inspiration Scroll (Guest)**
   - Land on localized home feed → infinite scroll of short-form creative cards (auto-play video or animated image stack) → view details, engagement stats → optional share → prompt to sign up when attempting to interact beyond browse.
2. **Create & Publish (Creator)**
   - Open creation composer → input text / upload image(s) → select templates/prompts → AI (nanobanana + Gemini) generates multiple mockups → user tweaks options → publish to feed with captions, tags, product metadata.
3. **Generate & Order (Creator/Guest)**
   - From any creation → tap “Recreate” → modify prompt → regenerate mockups → configure product options (size, color, material) → add to cart → one-tap checkout with stored payment (registered) or guest checkout (limited) → order confirmation.
4. **Engage & Socialize**
   - Like, comment, follow creators, remix/duet (derive new creation) → notifications inbox → share externally.
5. **Moderation & Ops (Admin)**
   - Review flagged content (auto + user reports) → approve/ban → view dashboards for content volume, orders, logistics status → manage refunds/returns.

## 5. Functional Scope
### 5.1 Content & Feed
- Infinite personalized feed with region-aware ranking (language, locale).
- Content types: AI-generated static images, GIF/short-loop video previews, multi-image carousels.
- Metadata: captions, hashtags, creator profile, product availability, engagement metrics.
- Interaction: like, comment, follow, share, save, report, remix.
- Search & discovery: keyword, hashtag, creator, trending topics.

### 5.2 Creation & AI Generation
- Composer supporting:
  - Text-only prompts
  - Image upload (single or multi) + optional text prompt
  - Multi-image selection for style reference
- Nanobanana pipeline for creative ideation (mockups, variations).
- Gemini integration for fast refining, copy suggestions, product title/description.
- Result management: gallery of generations, ability to mark favorites, compare variations.

### 5.3 Ecommerce Core
- Product catalog dynamically created per creation (SKU template + user-selected attributes).
- Configurable product attributes (size, color, material, finish) with inventory & pricing rules.
- Cart & checkout flow:
  - Guest checkout with email + minimal info
  - Registered checkout with saved addresses & payments
  - Payment providers: Stripe (cards, Apple Pay, Google Pay), PayPal, plus regional methods (e.g., Klarna/EU, Tabby/Middle East).
- Shipping integrations: rate calculation, label generation, tracking updates for US/EU/Middle East carriers.
- Order management: status updates, cancellation windows, returns, refunds.

### 5.4 Social Graph & Notifications
- Follow system, personalized notifications (new followers, comments, remix activity, order status).
- Inbox grouped by activity type with read/unread state.

### 5.5 Moderation & Safety
- Automated scanning (AI + rules) for banned content, trademark/copyright keywords, NSFW.
- User reporting with categories (IP violation, harassment, spam, etc.).
- Moderation queue with escalation workflows and audit logs.
- Threshold-based throttling for suspicious accounts.

### 5.6 Analytics & Admin
- Admin portal with role-based access.
- Dashboards:
  - Engagement: DAU, MAU, session duration, creation volume, top trends.
  - Commerce: GMV, conversion funnels, fulfillment SLAs, refunds.
  - Safety: flag rates, response times, ban statistics.
- Manual overrides: feature/unfeature content, push notifications, promo codes.

### 5.7 Localization & Accessibility
- Locale auto-detection; support English, Arabic, major EU languages.
- RTL layout for Arabic.
- Accessible UI (WCAG AA), captions for video content, alt text prompts.

## 6. Non-Functional Requirements
- **Performance**: Sub-2s feed load in target regions, <1s AI generation preview placeholder, full mockups within 10s.
- **Scalability**: Handle 10k concurrent users at MVP, design for rapid horizontal scaling.
- **Reliability**: >=99.5% uptime, graceful degradation when AI services throttle.
- **Security & Privacy**: GDPR & CCPA compliance, secure payment handling (PCI via providers), content storage with regional compliance.
- **Observability**: Telemetry for feed performance, AI latency, checkout drop-offs, moderation queue health.

## 7. Dependencies & Integrations
- Firebase/Firestore retained for auth, data storage, cloud functions.
- Nanobanana + Gemini for AI generation.
- Payment: Stripe, PayPal, plus regional providers (Klarna, Tabby or similar).
- Logistics: Integrate with shipping aggregators (ShipBob, EasyPost) for multi-region coverage.
- CDN/video hosting for media delivery (Cloudflare Stream or similar).

## 8. Constraints & Assumptions
- Existing codebase will be refactored/rewritten to support new architecture; legacy UI deprecated.
- Mobile-first design; desktop web parity where feasible.
- Moderation must balance speed with accuracy; assume hybrid automation + human review.
- Anonymous browsing allowed; creation/checkout requires account (guest checkout has limited scope).
- Legal review required for IP handling and user-generated merchandise.

## 9. Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| AI-generated IP violations | Legal exposure | Strengthen filters, manual review for flagged content, brand-safe prompt guidelines |
| AI latency or failures | Poor UX | Provide fast placeholder previews, retry queue, allow user to regenerate |
| Payment/fulfillment complexity across regions | Failed orders, ops load | Phase integrations by region, leverage aggregators, pilot with US first |
| Content moderation scale | Safety issues | Layered automation, community reporting, staffing plan, rate limits |
| Aggressive timeline (1–4 weeks) | Feature trade-offs | Prioritize MVP scope (browse, generate, checkout), phase-in social extras |

## 10. Milestones (MVP-first delivery)
1. **Week 0–1: Foundations**
   - Finalize information architecture & UX flows
   - Set up AI pipelines, payment/logistics sandboxes, moderation checklist
2. **Week 2: Core Build**
   - Implement feed service, creation composer, AI generation UI
   - Stand up cart/checkout with Stripe, integrate Firestore schema
3. **Week 3: Social & Safety Layer**
   - Enable likes/comments/follows, notifications MVP
   - Deploy moderation pipeline + admin queue
4. **Week 4: Polish & Launch**
   - Localization/RTL, performance tuning, analytics dashboards
   - Beta launch, gather telemetry, iterate rapid fixes

Post-MVP roadmap: advanced creator tooling, influencer commerce features, expanded payment/fulfillment, deeper personalization.

## 11. Open Questions
- Final list of regional payment providers & logistics partners?
- Policy decisions for revenue sharing/creator payouts?
- Long-term storage strategy for large media volumes?
- Legal review of user-generated merchandise workflows?
- Integration plan with existing marketing/CRM systems?
