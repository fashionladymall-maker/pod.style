'use server';

/**
 * @fileOverview An AI agent that modifies the model's appearance in the generated mockup to resemble a person or character in an inspiration image.
 *
 * - modifyModelAppearance - A function that handles the model appearance modification process.
 * - ModifyModelAppearanceInput - The input type for the modifyModelAppearance function.
 * - ModifyModelAppearanceOutput - The return type for the modifyModelAppearance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModifyModelAppearanceInputSchema = z.object({
  patternDataUri: z
    .string()
    .describe(
      "A creative design to be printed on a t-shirt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  colorName: z.string().describe('The color of the t-shirt.'),
});
export type ModifyModelAppearanceInput = z.infer<typeof ModifyModelAppearanceInputSchema>;

const ModifyModelAppearanceOutputSchema = z.string().describe('A data URI of the generated model image.');
export type ModifyModelAppearanceOutput = z.infer<typeof ModifyModelAppearanceOutputSchema>;

export async function modifyModelAppearance(input: ModifyModelAppearanceInput): Promise<ModifyModelAppearanceOutput> {
  return modifyModelAppearanceFlow(input);
}

const buildAppearancePrompt = (input: ModifyModelAppearanceInput): string => `A stunning, ultra-high-resolution, and crystal-clear fashion photograph of a model wearing a ${input.colorName} t-shirt. The image must look like it was taken with a professional DSLR camera, with sharp focus and intricate details. The t-shirt must feature this exact design printed prominently on the chest.

CRITICAL INSTRUCTION: If the provided design features a person or character, the model in this photograph MUST look as similar as possible to that character. Match the face, hair, and overall appearance.

The overall image should be a professional product shot, filling the entire vertical phone screen frame. No text or logos on the image. Maintain artistic consistency with the provided design image.`;

const modifyModelAppearanceFlow = ai.defineFlow(
  {
    name: 'modifyModelAppearanceFlow',
    inputSchema: ModifyModelAppearanceInputSchema,
    outputSchema: ModifyModelAppearanceOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { text: buildAppearancePrompt(input) },
        { media: { url: input.patternDataUri } }
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });
    if (!media?.url) {
      throw new Error('No image was generated.');
    }
    return media.url;
  }
);
