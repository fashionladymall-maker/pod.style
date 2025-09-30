# Source Tree Overview

- `src/app/`: Next.js App Router entrypoints, layouts, and metadata
- `src/components/`: UI primitives and screen-level components
- `src/features/`: Domain modules containing server actions, services, repositories, and models
  - `creations/`, `orders/`, `user-models/` etc.
- `src/ai/`: Genkit flow definitions, pipeline orchestrators, dev scripts
- `src/context/`: React context providers (e.g., Auth provider)
- `src/lib/`: Shared utilities, Firebase clients, type definitions
- `src/hooks/`: Reusable hooks such as `use-toast`
- `src/server/`: Server-side utilities (Firebase Admin wrappers, aggregate actions)
- `functions/`: Firebase Cloud Functions entrypoints and scripts
- `docs/`: Planning artifacts (PRD, architecture, QA)
- `.bmad-core/`: BMAD configuration, agents, tasks, workflows

Use `npm run lint`, `npm run typecheck`, and the BMAD story backlog under `docs/stories/` for implementation guidance.
