'use server';
/**
 * @fileOverview Generates a realistic mockup of a product pattern on a model.
 *
 * - generateModelMockup - A function that generates the model mockup.
 * - GenerateModelMockupInput - The input type for the generateModelMockup function.
 * - GenerateModelMockupOutput - The return type for the generateModelMockup function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateModelMockupInputSchema = z.object({
  patternDataUri: z
    .string()
    .describe(
      "A photo of a pattern, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  colorName: z.string().describe('The color of the product.'),
  category: z.string().describe('The product category, e.g., "T-shirt" or "Hat".'),
});
export type GenerateModelMockupInput = z.infer<typeof GenerateModelMockupInputSchema>;

const GenerateModelMockupOutputSchema = z.object({
  modelImageUri: z.string().describe('The data URI of the generated model image.'),
});
export type GenerateModelMockupOutput = z.infer<typeof GenerateModelMockupOutputSchema>;

export async function generateModelMockup(input: GenerateModelMockupInput): Promise<GenerateModelMockupOutput> {
  return generateModelMockupFlow(input);
}


const generateModelMockupFlow = ai.defineFlow(
  {
    name: 'generateModelMockupFlow',
    inputSchema: GenerateModelMockupInputSchema,
    outputSchema: GenerateModelMockupOutputSchema,
  },
  async (input) => {
    // Extract the english part of the category name for the prompt.
    const categoryMatch = input.category.match(/\(([^)]+)\)/);
    const categoryName = categoryMatch ? categoryMatch[1] : input.category;

    const prompt = `A stunning, ultra-high-resolution, and crystal-clear fashion photograph of a model using a ${input.colorName} ${categoryName}. The image must look like it was taken with a professional DSLR camera, with sharp focus and intricate details. The ${categoryName} must feature this exact design printed prominently on it.

CRITICAL INSTRUCTION: If the provided design features a person or character, the model in this photograph MUST look as similar as possible to that character. Match the face, hair, and overall appearance. If the product is not a wearable item (e.g. a mug or a pillow), this instruction can be ignored.

The overall image should be a professional product shot, filling the entire vertical phone screen frame. No text or logos on the image. Maintain artistic consistency with the provided design image.`;

    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        { text: prompt },
        { media: { url: input.patternDataUri } }
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media || !media.url) {
      throw new Error('No image was generated for the model mockup.');
    }
    
    return {
      modelImageUri: media.url,
    };
  }
);
