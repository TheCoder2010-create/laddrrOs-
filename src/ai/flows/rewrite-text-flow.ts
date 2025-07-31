'use server';
/**
 * @fileOverview An AI flow for rewriting user-provided text for clarity and professionalism.
 *
 * - rewriteText - A function that takes a string and returns a rewritten version.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RewriteTextInputSchema = z.object({
  textToRewrite: z.string().describe('The user-provided text that needs to be rewritten.'),
});
export type RewriteTextInput = z.infer<typeof RewriteTextInputSchema>;

const RewriteTextOutputSchema = z.object({
    rewrittenText: z.string().describe('The AI-generated rewritten text.'),
});
export type RewriteTextOutput = z.infer<typeof RewriteTextOutputSchema>;

const prompt = ai.definePrompt({
  name: 'rewriteTextPrompt',
  input: { schema: RewriteTextInputSchema },
  output: { schema: RewriteTextOutputSchema },
  prompt: `You are an expert editor specializing in professional and clear communication. A user wants to submit an anonymous concern and needs help phrasing it effectively.

Rewrite the following text to be more clear, concise, and professional, while preserving the original meaning and key details. Ensure the tone is serious and direct, suitable for a formal complaint or feedback to HR or management.

Original Text:
"{{{textToRewrite}}}"

Generate the rewritten text now.`,
});

const rewriteTextFlow = ai.defineFlow(
  {
    name: 'rewriteTextFlow',
    inputSchema: RewriteTextInputSchema,
    outputSchema: RewriteTextOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI rewrite failed to produce an output.");
    }
    return output;
  }
);

export async function rewriteText(input: RewriteTextInput): Promise<RewriteTextOutput> {
  return rewriteTextFlow(input);
}
