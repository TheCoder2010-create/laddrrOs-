
/**
 * @fileOverview Zod schemas for the "Nets" conversation simulation feature.
 */

import { z } from 'zod';

export const NetsMessageSchema = z.object({
  role: z.enum(["user", "model", "system"]),
  content: z.string(),
});
export type NetsMessage = z.infer<typeof NetsMessageSchema>;

export const NetsInitialInputSchema = z.object({
  scenario: z.string().describe("The user-defined scenario for the conversation."),
  persona: z.string().describe("The persona the AI should adopt, e.g., 'Team Lead'."),
  difficulty: z.string().describe("The difficulty level of the conversation, e.g., 'Strict'."),
});
export type NetsInitialInput = z.infer<typeof NetsInitialInputSchema>;

export const NetsConversationInputSchema = NetsInitialInputSchema.extend({
  history: z.array(NetsMessageSchema).describe("The conversation history so far."),
});
export type NetsConversationInput = z.infer<typeof NetsConversationInputSchema>;


// Schemas for the scenario suggestion feature
const PastIssueSchema = z.object({
    employeeName: z.string(),
    missedSignals: z.array(z.string()).optional(),
    criticalInsightSummary: z.string().optional(),
    coachingRecs: z.array(z.string()).optional(),
});

const CoachingGoalSchema = z.object({
    area: z.string(),
    resource: z.string(),
});

export const NetsSuggestionInputSchema = z.object({
    supervisorName: z.string(),
    pastIssues: z.array(PastIssueSchema),
    coachingGoalsInProgress: z.array(CoachingGoalSchema),
});
export type NetsSuggestionInput = z.infer<typeof NetsSuggestionInputSchema>;

export const NetsSuggestionOutputSchema = z.object({
    suggestedScenario: z.string().describe("A concise, one-sentence practice scenario suggested by the AI based on user's history."),
});
export type NetsSuggestionOutput = z.infer<typeof NetsSuggestionOutputSchema>;
