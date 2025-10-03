# Firebase Studio

This is a Next.js starter in Firebase Studio.

To get started, take a look at `src/app/page.tsx`.

## Supervising Development with Codex + MCP

See `docs/workflows/codex-supervision.md` for a turnkey setup that combines the Codex VS Code plugin (control plane), Codex CLI (execution), Chrome DevTools MCP (acceptance), and CI (final gate). The workflow ships with VS Code tasks, npm scripts, and report locations so long-running stories can be supervised without keeping a single chat session open.

## Deploying with Firebase

The project is already configured for Firebase App Hosting. Follow the steps in
[`docs/firebase-deploy.md`](docs/firebase-deploy.md) to publish the site with the
Firebase CLI, including instructions for securely providing Firebase Admin credentials.

## Configuring Genkit access to Gemini

Genkit relies on a Gemini API key that you can create in [Google AI Studio](https://aistudio.google.com/).

1. Generate or locate your Gemini API key in AI Studio.
2. Add the key to your local environment by copying `.env.local` and replacing the
   placeholder value for `GEMINI_API_KEY` with your real key. Never commit the real value.
3. Restart your development server (`npm run dev`) so that Genkit can load the updated
   environment before invoking any AI-backed actions.
