import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Explicitly pass API key to ensure it's available in all environments
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    })
  ],
  model: 'googleai/gemini-2.5-flash',
});
