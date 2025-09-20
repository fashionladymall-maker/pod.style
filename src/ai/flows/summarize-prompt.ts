'use server';
/**
 * @fileOverview Summarizes a given text prompt into a four-character Chinese phrase.
 *
 * - summarizePrompt - A function that handles the prompt summarization.
 * - SummarizePromptInput - The input type for the summarizePrompt function.
 * - SummarizePromptOutput - The return type for the summarizePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePromptInputSchema = z.object({
  prompt: z.string().describe('The text prompt to be summarized.'),
});
export type SummarizePromptInput = z.infer<typeof SummarizePromptInputSchema>;

const SummarizePromptOutputSchema = z.object({
  summary: z.string().describe('The four-character Chinese summary.'),
});
export type SummarizePromptOutput = z.infer<typeof SummarizePromptOutputSchema>;

export async function summarizePrompt(
  input: SummarizePromptInput
): Promise<SummarizePromptOutput> {
  return summarizePromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizePrompt',
  input: {schema: SummarizePromptInputSchema},
  output: {schema: SummarizePromptOutputSchema},
  prompt: `You are an expert in Chinese literature and linguistics. Your task is to summarize the user's creative idea into a concise and poetic four-character Chinese phrase (四字成语 or a creative four-character word).

The user's prompt is:
"{{{prompt}}}"

RULES:
1.  The output MUST be exactly four Chinese characters.
2.  The phrase should capture the essence and mood of the prompt.
3.  Be creative. It doesn't have to be a traditional idiom (成语), a creative, descriptive phrase is also great.
4.  Do not include any punctuation, explanation, or any other characters. Just the four characters.`,
});

const summarizePromptFlow = ai.defineFlow(
  {
    name: 'summarizePromptFlow',
    inputSchema: SummarizePromptInputSchema,
    outputSchema: SummarizePromptOutputSchema,
  },
  async input => {
    // If the prompt is very short, we can use it directly or pad it.
    // For simplicity, we just call the LLM for all cases.
    if (!input.prompt) {
      return { summary: '无题创作' }; // "Untitled Creation"
    }

    const {output} = await prompt(input);

    if (!output?.summary || output.summary.length > 5) { // A bit of leeway for safety
        // Fallback in case the model doesn't follow instructions
        return { summary: input.prompt.substring(0, 4) };
    }

    return output;
  }
);
