// A Genkit Flow for generating t-shirt patterns based on a text prompt and an optional inspiration image.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTShirtPatternInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the desired t-shirt pattern.'),
  styleInstruction: z.string().describe('A text prompt of the desired art style'),
  uploadedImage: z
    .string()
    .optional()
    .describe(
      "An optional photo to use as inspiration, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateTShirtPatternInput = z.infer<typeof GenerateTShirtPatternInputSchema>;

const GenerateTShirtPatternOutputSchema = z.object({
  pattern: z.string().describe('The generated t-shirt pattern as a data URI.'),
});
export type GenerateTShirtPatternOutput = z.infer<typeof GenerateTShirtPatternOutputSchema>;

export async function generateTShirtPattern(input: GenerateTShirtPatternInput): Promise<GenerateTShirtPatternOutput> {
  return generateTShirtPatternFlow(input);
}

const generateTShirtPatternPrompt = ai.definePrompt({
  name: 'generateTShirtPatternPrompt',
  input: {schema: GenerateTShirtPatternInputSchema},
  output: {schema: GenerateTShirtPatternOutputSchema},
  prompt: `Generate a stunning, ultra-high-resolution, and crystal-clear creative image suitable for a t-shirt print. The concept is: '{{{prompt}}}'{{#if styleInstruction}}, {{{styleInstruction}}}{{/if}}. It should be incredibly detailed with sharp focus.

IMPORTANT RULES:
1.  STRICTLY do NOT add any text, letters, or words to the image unless the user explicitly included text in quotation marks in their prompt.
2.  If the user asks for text, the text MUST be in English.
3.  The final image should only contain the artwork, with no background unless it's part of the scene.

{{#if uploadedImage}}
Incorporate elements from the following image into the generated pattern: {{media url=uploadedImage}}
{{/if}}`,
});

const generateTShirtPatternFlow = ai.defineFlow(
  {
    name: 'generateTShirtPatternFlow',
    inputSchema: GenerateTShirtPatternInputSchema,
    outputSchema: GenerateTShirtPatternOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview',
        prompt: [
          {
            text: generateTShirtPatternPrompt(input).prompt
          },
          ...(input.uploadedImage ? [{
            media: {url: input.uploadedImage}
          }] : [])
        ],
        config: {
          responseModalities: ['IMAGE']
        }
      });

    return {pattern: media!.url!};
  }
);
