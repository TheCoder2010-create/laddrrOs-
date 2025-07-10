
'use server';
/**
 * @fileOverview Handles tracking of anonymous feedback submissions.
 *
 * - trackFeedback - A function that looks up a submission by its tracking ID.
 * - TrackFeedbackInput - The input type for the tracking function.
 * - TrackFeedbackOutput - The return type for the tracking function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getFeedbackByTrackingId } from '@/services/feedback-service';

const TrackFeedbackInputSchema = z.object({
  trackingId: z.string().describe('The unique tracking ID of the feedback submission.'),
});
export type TrackFeedbackInput = z.infer<typeof TrackFeedbackInputSchema>;

const TrackedFeedbackSchema = z.object({
  trackingId: z.string(),
  subject: z.string(),
  message: z.string(),
  submittedAt: z.string().describe('The ISO 8601 date string of when the feedback was submitted.'),
});
export type TrackedFeedback = z.infer<typeof TrackedFeedbackSchema>;


const TrackFeedbackOutputSchema = z.object({
  found: z.boolean().describe('Whether a submission with the given tracking ID was found.'),
  feedback: TrackedFeedbackSchema.optional(),
});
export type TrackFeedbackOutput = z.infer<typeof TrackFeedbackOutputSchema>;


export async function trackFeedback(input: TrackFeedbackInput): Promise<TrackFeedbackOutput> {
  return trackFeedbackFlow(input);
}


const trackFeedbackFlow = ai.defineFlow(
  {
    name: 'trackFeedbackFlow',
    inputSchema: TrackFeedbackInputSchema,
    outputSchema: TrackFeedbackOutputSchema,
  },
  async ({ trackingId }) => {
    const feedback = await getFeedbackByTrackingId(trackingId);

    if (!feedback) {
      return {
        found: false,
      };
    }

    return {
      found: true,
      feedback: {
        trackingId: feedback.trackingId,
        subject: feedback.subject,
        message: feedback.message,
        submittedAt: feedback.submittedAt.toISOString(),
      },
    };
  }
);
