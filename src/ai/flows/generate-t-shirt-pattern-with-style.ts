'use server';
/**
 * @fileOverview T-Shirt pattern generation with style selection.
 *
 * - generateTShirtPatternWithStyle - A function that generates a T-shirt pattern based on a prompt, inspiration image and style selection.
 * - GenerateTShirtPatternWithStyleInput - The input type for the generateTShirtPatternWithStyle function.
 * - GenerateTShirtPatternWithStyleOutput - The return type for the generateTShirtPatternWithStyle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTShirtPatternWithStyleInputSchema = z.object({
  prompt: z.string().describe('The prompt for the T-shirt design.'),
  inspirationImage: z
    .string()
    .optional()
    .describe(
      "An optional inspiration image for the T-shirt design, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  style: z
    .string()
    .optional()
    .describe('The artistic style to apply to the generated pattern.'),
});
export type GenerateTShirtPatternWithStyleInput = z.infer<
  typeof GenerateTShirtPatternWithStyleInputSchema
>;

const GenerateTShirtPatternWithStyleOutputSchema = z.object({
  generatedImage: z
    .string()
    .describe(
      'The generated T-shirt pattern as a data URI that must include a MIME type and use Base64 encoding. Expected format: data:<mimetype>;base64,<encoded_data>.'
    ),
});
export type GenerateTShirtPatternWithStyleOutput = z.infer<
  typeof GenerateTShirtPatternWithStyleOutputSchema
>;

export async function generateTShirtPatternWithStyle(
  input: GenerateTShirtPatternWithStyleInput
): Promise<GenerateTShirtPatternWithStyleOutput> {
  return generateTShirtPatternWithStyleFlow(input);
}

const generateTShirtPatternWithStyleFlow = ai.defineFlow(
  {
    name: 'generateTShirtPatternWithStyleFlow',
    inputSchema: GenerateTShirtPatternWithStyleInputSchema,
    outputSchema: GenerateTShirtPatternWithStyleOutputSchema,
  },
  async input => {
    let textPrompt = `Generate a stunning, ultra-high-resolution, and crystal-clear creative image suitable for printing on a variety of products. The concept is: '${input.prompt}'`;
    if (input.style) {
        textPrompt += `, in the style of ${input.style}`;
    }
    textPrompt += `. It should be incredibly detailed with sharp focus.

IMPORTANT RULES:
1. The final image should be a PNG file, optimized for web and mobile use to ensure a smaller file size without sacrificing quality.
2. STRICTLY do NOT add any text, letters, or words to the image unless the user explicitly included text in quotation marks in their prompt.
3. If the user asks for text, the text MUST be in English.
4. The final image should only contain the artwork, with no background unless it's part of the scene.`;

    if (input.inspirationImage) {
        textPrompt += `\n\nIncorporate the style and elements of the following inspiration image:`;
    }

    const promptParts: ({text: string} | {media: {url: string}})[] = [
      { text: textPrompt }
    ];

    if (input.inspirationImage) {
      promptParts.push({ media: { url: input.inspirationImage } });
    }
    
    const {media} = await ai.generate({
      prompt: promptParts,
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media?.url) {
      throw new Error('The AI failed to return an image. This might be due to a safety policy violation.');
    }

    return {generatedImage: media.url};
  }
);
