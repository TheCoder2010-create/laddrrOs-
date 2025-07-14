
/**
 * @fileOverview Zod schemas for the on-demand anonymous feedback summarization.
 * This file is kept separate to allow its non-async exports (the schemas)
 * to be imported into client components without violating the "use server"
 * directive's constraints.
 */

import { z } from 'zod';

export const SummarizeAnonymousFeedbackInputSchema = z.object({
  subject: z.string().describe("The subject line of the anonymous feedback."),
  message: z.string().describe("The detailed message of the anonymous feedback."),
});
export type SummarizeAnonymousFeedbackInput = z.infer<typeof SummarizeAnonymousFeedbackInputSchema>;

export const SummarizeAnonymousFeedbackOutputSchema = z.object({
    summary: z.string().describe("A concise, one-sentence summary of the core issue or feedback provided."),
    criticality: z.enum(['Low', 'Medium', 'High', 'Critical']).describe("An assessment of the feedback's urgency and potential impact."),
    criticalityReasoning: z.string().describe("A brief justification for the assigned criticality level, based on keywords, tone, and potential policy violations mentioned in the feedback."),
});
export type SummarizeAnonymousFeedbackOutput = z.infer<typeof SummarizeAnonymousFeedbackOutputSchema>;
