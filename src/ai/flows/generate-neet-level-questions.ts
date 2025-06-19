// src/ai/flows/generate-neet-level-questions.ts
'use server';
/**
 * @fileOverview Generates multiple-choice questions at the NEET exam level.
 *
 * - generateNeetLevelQuestions - A function that generates NEET-level multiple-choice questions.
 * - GenerateNeetLevelQuestionsInput - The input type for the generateNeetLevelQuestions function.
 * - GenerateNeetLevelQuestionsOutput - The output type for the generateNeetLevelQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNeetLevelQuestionsInputSchema = z.object({
  extractedText: z
    .string()
    .describe("The extracted text from the book page image."),
});
export type GenerateNeetLevelQuestionsInput = z.infer<typeof GenerateNeetLevelQuestionsInputSchema>;

const GenerateNeetLevelQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The question text.'),
      options: z.array(z.string()).length(4).describe('Four possible answer choices.'),
      correctAnswerIndex: z.number().int().min(0).max(3).describe('The index of the correct answer in the options array.'),
    })
  ).length(10).describe('An array of 10 multiple-choice questions.'),
});
export type GenerateNeetLevelQuestionsOutput = z.infer<typeof GenerateNeetLevelQuestionsOutputSchema>;

export async function generateNeetLevelQuestions(input: GenerateNeetLevelQuestionsInput): Promise<GenerateNeetLevelQuestionsOutput> {
  return generateNeetLevelQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNeetLevelQuestionsPrompt',
  input: {schema: GenerateNeetLevelQuestionsInputSchema},
  output: {schema: GenerateNeetLevelQuestionsOutputSchema},
  prompt: `You are an expert in creating NEET (National Eligibility cum Entrance Test) level questions.

  Based on the provided text, generate 10 multiple-choice questions with 4 options each.
  The questions should be relevant to the NEET exam syllabus and of appropriate difficulty level.
  Ensure that only one option is correct for each question.
  Return the questions in JSON format as an array of question objects.

  Extracted Text: {{{extractedText}}}
  `,
});

const generateNeetLevelQuestionsFlow = ai.defineFlow(
  {
    name: 'generateNeetLevelQuestionsFlow',
    inputSchema: GenerateNeetLevelQuestionsInputSchema,
    outputSchema: GenerateNeetLevelQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
