'use server';
/**
 * @fileOverview A flow that generates a t-shirt design incorporating elements from an inspiration image.
 *
 * - generateTshirtDesign - A function that handles the t-shirt design generation process.
 * - GenerateTshirtDesignInput - The input type for the generateTshirtDesign function.
 * - GenerateTshirtDesignOutput - The return type for the generateTshirtDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTshirtDesignInputSchema = z.object({
  prompt: z.string().describe('The text prompt for the t-shirt design.'),
  inspirationImage: z
    .string()
    .describe(
      "An optional inspiration image to use for the t-shirt design, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    )
    .optional(),
  style: z.string().describe('The art style to use for the generated image').optional(),
});
export type GenerateTshirtDesignInput = z.infer<typeof GenerateTshirtDesignInputSchema>;

const GenerateTshirtDesignOutputSchema = z.object({
  design: z.string().describe('The generated t-shirt design as a data URI.'),
});
export type GenerateTshirtDesignOutput = z.infer<typeof GenerateTshirtDesignOutputSchema>;

export async function generateTshirtDesign(input: GenerateTshirtDesignInput): Promise<GenerateTshirtDesignOutput> {
  return generateTshirtDesignFlow(input);
}

const buildDesignPrompt = (input: GenerateTshirtDesignInput): string => {
  const styleSuffix = input.style ? `, ${input.style}` : '';
  const basePrompt = `Generate a stunning, ultra-high-resolution, and crystal-clear creative image suitable for a t-shirt print. The concept is: '${input.prompt}'${styleSuffix}.

IMPORTANT RULES:
1.  STRICTLY do NOT add any text, letters, or words to the image unless the user explicitly included text in quotation marks in their prompt.
2.  If the user asks for text, the text MUST be in English.
3.  The final image should only contain the artwork, with no background unless it's part of the scene.`;

  if (input.inspirationImage) {
    return `${basePrompt}

Incorporate elements from the provided inspiration image into the design.`;
  }

  return basePrompt;
};

const generateTshirtDesignFlow = ai.defineFlow(
  {
    name: 'generateTshirtDesignFlow',
    inputSchema: GenerateTshirtDesignInputSchema,
    outputSchema: GenerateTshirtDesignOutputSchema,
  },
  async input => {
    const promptPayload: ({ text: string } | { media: { url: string } })[] = [
      { text: buildDesignPrompt(input) }
    ];

    if (input.inspirationImage) {
      promptPayload.push({ media: { url: input.inspirationImage } });
    }

    const {output} = await ai.generate({
      prompt: promptPayload,
      model: 'googleai/gemini-2.5-flash-image-preview',
      config: { responseModalities: ['IMAGE'] },
    });

    if (!output?.media?.url) {
      throw new Error('Failed to generate t-shirt design.');
    }

    return { design: output.media.url };
  }
);
