
"use server";

import { generateTShirtPatternWithStyle } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import type { GenerateTShirtPatternWithStyleInput } from '@/ai/flows/generate-t-shirt-pattern-with-style';
import { generateModelMockup } from '@/ai/flows/generate-model-mockup';
import type { GenerateModelMockupInput } from '@/ai/flows/generate-model-mockup';
import { addCreation, getCreations, deleteCreation, updateCreationModel } from '@/lib/firestore';
import { Creation } from '@/lib/types';

interface GeneratePatternActionInput extends GenerateTShirtPatternWithStyleInput {
  userId: string;
  category: string;
}

export async function generatePatternAction(input: GeneratePatternActionInput): Promise<Creation> {
  const { userId, prompt, inspirationImage, style, category } = input;
  try {
    const result = await generateTShirtPatternWithStyle({
        prompt,
        inspirationImage,
        style,
    });
    if (!result.generatedImage) {
        throw new Error('The AI failed to return an image. This might be due to a safety policy violation.');
    }
    
    const newCreation = await addCreation({
        userId,
        prompt,
        style: style || 'None',
        category,
        patternUri: result.generatedImage,
    });

    return newCreation;

  } catch (error) {
    console.error('Error in generatePatternAction:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during pattern generation.');
  }
}

interface GenerateModelActionInput extends GenerateModelMockupInput {
    creationId: string;
}

export async function generateModelAction(input: GenerateModelActionInput): Promise<Creation> {
  const { creationId, patternDataUri, colorName, category } = input;
  try {
    const result = await generateModelMockup({
        patternDataUri,
        colorName,
        category
    });
    if (!result.modelImageUri) {
        throw new Error('The AI failed to return a model image.');
    }

    const updatedCreation = await updateCreationModel(creationId, result.modelImageUri);
    return updatedCreation;

  } catch (error) {
    console.error('Error in generateModelAction:', error);
    throw new Error(error instanceof Error ? error.message : 'An unknown error occurred during model generation.');
  }
}


export async function getCreationsAction(userId: string): Promise<Creation[]> {
    try {
        const creations = await getCreations(userId);
        return creations;
    } catch (error) {
        console.error('Error in getCreationsAction:', error);
        throw new Error('Failed to fetch creations.');
    }
}

export async function deleteCreationAction(creationId: string): Promise<{ success: boolean }> {
    try {
        await deleteCreation(creationId);
        return { success: true };
    } catch (error) {
        console.error('Error in deleteCreationAction:', error);
        throw new Error('Failed to delete creation.');
    }
}
