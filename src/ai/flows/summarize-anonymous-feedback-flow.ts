
'use server';
/**
 * @fileOverview An AI flow for summarizing anonymous feedback on-demand.
 * 
 * - summarizeAnonymousFeedback - A function that takes a subject and message and returns a structured analysis.
 */

import { ai } from '@/ai/genkit';
import { 
    SummarizeAnonymousFeedbackInputSchema, 
    SummarizeAnonymousFeedbackOutputSchema,
    type SummarizeAnonymousFeedbackInput,
    type SummarizeAnonymousFeedbackOutput
} from '@/ai/schemas/summarize-anonymous-feedback-schemas';


const prompt = ai.definePrompt({
    name: 'summarizeAnonymousFeedbackPrompt',
    input: { schema: SummarizeAnonymousFeedbackInputSchema },
    output: { schema: SummarizeAnonymousFeedbackOutputSchema },
    prompt: `You are an expert HR analyst AI. Your task is to analyze an anonymous feedback submission and provide a concise summary and a criticality rating.

Analyze the following submission:
Subject: {{{subject}}}
Message: {{{message}}}

Instructions:
1.  **Summary**: Write a neutral, one-sentence summary of the main point of the feedback.
2.  **Criticality**: Assign a criticality level from the following options: 'Low', 'Medium', 'High', 'Critical'.
    -   'Low': General feedback, suggestions, minor issues.
    -   'Medium': Concerns affecting team morale, workflow issues, repeated minor problems.
    -   'High': Allegations of unfair treatment, significant project impact, potential policy gray areas.
    -   'Critical': Reports of harassment, discrimination, safety violations, or clear policy breaches.
3.  **Criticality Reasoning**: Briefly explain why you chose that criticality level.

Generate the JSON output now.`,
});

const summarizeAnonymousFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeAnonymousFeedbackFlow',
    inputSchema: SummarizeAnonymousFeedbackInputSchema,
    outputSchema: SummarizeAnonymousFeedbackOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI analysis failed to produce a summary.");
    }
    return output;
  }
);

// Define and export an async wrapper function
export async function summarizeAnonymousFeedback(input: SummarizeAnonymousFeedbackInput): Promise<SummarizeAnonymousFeedbackOutput> {
    return summarizeAnonymousFeedbackFlow(input);
}
