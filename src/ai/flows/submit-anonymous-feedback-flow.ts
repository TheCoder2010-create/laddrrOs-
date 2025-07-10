'use server';
/**
 * @fileOverview Handles anonymous feedback submissions.
 *
 * - submitAnonymousFeedback - A function that processes the feedback and returns a tracking ID.
 * - AnonymousFeedbackInput - The input type for the submission.
 * - AnonymousFeedbackOutput - The return type for the submission.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';
import { saveFeedback, addAuditEvent } from '@/services/feedback-service';

const AnonymousFeedbackInputSchema = z.object({
  subject: z.string().describe('The subject of the feedback submission.'),
  message: z.string().describe('The detailed message of the feedback submission.'),
});
export type AnonymousFeedbackInput = z.infer<typeof AnonymousFeedbackInputSchema>;

const AnonymousFeedbackOutputSchema = z.object({
  trackingId: z.string().describe('A unique tracking ID for the user to follow up on their submission.'),
});
export type AnonymousFeedbackOutput = z.infer<typeof AnonymousFeedbackOutputSchema>;

const FeedbackAnalysisSchema = z.object({
    summary: z.string().describe("A concise, one-sentence summary of the user's feedback."),
    criticality: z.enum(["Low", "Medium", "High", "Critical"]).describe("The assessed criticality of the issue."),
    reasoning: z.string().describe("A brief explanation for the assigned criticality level.")
});

const analysisPrompt = ai.definePrompt({
    name: 'feedbackAnalysisPrompt',
    input: { schema: AnonymousFeedbackInputSchema },
    output: { schema: FeedbackAnalysisSchema },
    prompt: `You are an expert HR compliance and risk assessment agent. Your task is to analyze an employee's anonymous feedback submission.

    Analyze the following submission and provide a one-sentence summary of the core issue.

    Then, assess the criticality of the issue based on potential risk to the individual, the team, or the company (e.g., legal risk, safety risk, morale, operational disruption). The criticality levels are: Low, Medium, High, Critical.

    - Low: Minor issues, suggestions, or general feedback.
    - Medium: Interpersonal conflicts, minor policy violations, moderate morale issues.
    - High: Allegations of harassment, discrimination, significant policy breaches, potential safety issues.
    - Critical: Immediate threats to safety, severe misconduct, major legal risks (e.g., bribery, major fraud).

    Provide a brief reasoning for your criticality assessment.

    User's Subject: {{{subject}}}
    User's Message: {{{message}}}
    `,
});


export async function submitAnonymousFeedback(input: AnonymousFeedbackInput): Promise<AnonymousFeedbackOutput> {
  return submitAnonymousFeedbackFlow(input);
}


const submitAnonymousFeedbackFlow = ai.defineFlow(
  {
    name: 'submitAnonymousFeedbackFlow',
    inputSchema: AnonymousFeedbackInputSchema,
    outputSchema: AnonymousFeedbackOutputSchema,
  },
  async (input) => {
    console.log('Received anonymous feedback:', input.subject);
    
    // Step 1: Generate a tracking ID
    const trackingId = uuidv4();
    
    // Step 2: Save the initial feedback (this will create the first audit event)
    await saveFeedback({
      trackingId,
      subject: input.subject,
      message: input.message,
      submittedAt: new Date(),
    });

    // Step 3: Analyze the feedback with the AI agent
    const { output: analysis } = await analysisPrompt(input);
    if (!analysis) {
        throw new Error("Failed to get analysis from AI");
    }
    console.log('AI Analysis received:', analysis);

    // Step 4: Add the AI analysis event to the audit trail
    await addAuditEvent(trackingId, {
      event: 'AI Analysis Completed',
      details: `Criticality assessed as "${analysis.criticality}".`,
    });
    
    // Step 5: Update the record with the AI analysis results
    // This is a bit awkward with an in-memory store. A real DB would do an update.
    // For now, we fetch and modify the object.
    const feedbackRecord = await import('@/services/feedback-service').then(m => m.getFeedbackByTrackingId(trackingId));
    if (feedbackRecord) {
        feedbackRecord.summary = analysis.summary;
        feedbackRecord.criticality = analysis.criticality;
        feedbackRecord.criticalityReasoning = analysis.reasoning;
    }


    return {
      trackingId,
    };
  }
);
