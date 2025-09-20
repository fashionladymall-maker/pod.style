"use server";

import { generateTShirtPatternWithStyle } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import type { GenerateTShirtPatternWithStyleInput } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import { generateModelMockup } from '@/ai/flows/generate-model-mockup';
import type { GenerateModelMockupInput } from '@/ai/flows/generate-model-mockup';

export async function generatePatternAction(input: GenerateTShirtPatternWithStyleInput) {
  try {
    const result = await generateTShirtPatternWithStyle(input);
    if (!result.generatedImage) {
        throw new Error('The AI failed to return an image. This might be due to a safety policy violation.');
    }
    return result;
  } catch (error) {
    console.error('Error in generatePatternAction:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during pattern generation.');
  }
}

export async function generateModelAction(input: GenerateModelMockupInput) {
  try {
    const result = await generateModelMockup(input);
    if (!result.modelImageUri) {
        throw new Error('The AI failed to return a model image.');
    }
    return { modelImageUri: result.modelImageUri };
  } catch (error) {
    console.error('Error in generateModelAction:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during model generation.');
  }
}
