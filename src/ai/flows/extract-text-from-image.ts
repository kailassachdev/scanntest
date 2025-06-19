'use server';
/**
 * @fileOverview Extracts text from an image using Genkit and Google Gemini 2.0 Flash.
 *
 * - extractText - A function that handles the text extraction process.
 * - ExtractTextOutput - The output type for the extractText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractTextOutputSchema = z.object({
  extractedText: z.string().describe('The extracted text from the image.'),
});
export type ExtractTextOutput = z.infer<typeof ExtractTextOutputSchema>;

export async function extractText(photoDataUri: string): Promise<ExtractTextOutput> {
  return extractTextFlow(photoDataUri);
}

const extractTextFlow = ai.defineFlow(
  {
    name: 'extractTextFlow',
    inputSchema: z.string(),
    outputSchema: ExtractTextOutputSchema,
  },
  async photoDataUri => {
    const {text} = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: [
        {media: {url: photoDataUri}},
        {text: 'Extract the text from this image.'},
      ],
      config: {
        responseModalities: ['TEXT'],
      },
    });

    return {extractedText: text!};
  }
);
