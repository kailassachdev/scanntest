'use server';

/**
 * @fileOverview Assesses the difficulty of a question to determine if it aligns with the NEET exam difficulty level.
 *
 * - assessQuestionDifficulty - A function that assesses the difficulty of a question.
 * - AssessQuestionDifficultyInput - The input type for the assessQuestionDifficulty function.
 * - AssessQuestionDifficultyOutput - The return type for the assessQuestionDifficulty function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AssessQuestionDifficultyInputSchema = z.object({
  question: z.string().describe('The question to assess.'),
  choices: z.array(z.string()).describe('The choices for the question.'),
  extractedText: z.string().describe('The extracted text from the book page.'),
});
export type AssessQuestionDifficultyInput = z.infer<
  typeof AssessQuestionDifficultyInputSchema
>;

const AssessQuestionDifficultyOutputSchema = z.object({
  isNeetLevel: z
    .boolean()
    .describe(
      'Whether the question is appropriate for the NEET exam difficulty level.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the assessment of the question difficulty.'
    ),
});
export type AssessQuestionDifficultyOutput = z.infer<
  typeof AssessQuestionDifficultyOutputSchema
>;

export async function assessQuestionDifficulty(
  input: AssessQuestionDifficultyInput
): Promise<AssessQuestionDifficultyOutput> {
  return assessQuestionDifficultyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'assessQuestionDifficultyPrompt',
  input: {schema: AssessQuestionDifficultyInputSchema},
  output: {schema: AssessQuestionDifficultyOutputSchema},
  prompt: `You are an expert educator specializing in NEET exam preparation. You will assess whether the given question aligns with the NEET exam difficulty level, based on the extracted text from the book page. 

  Extracted Text: {{{extractedText}}}

  Question: {{{question}}}
  Choices: {{#each choices}}- {{{this}}}\n{{/each}}

  Based on the extracted text and your expertise, determine if the question is appropriate for the NEET exam. Explain your reasoning.
`,
});

const assessQuestionDifficultyFlow = ai.defineFlow(
  {
    name: 'assessQuestionDifficultyFlow',
    inputSchema: AssessQuestionDifficultyInputSchema,
    outputSchema: AssessQuestionDifficultyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
