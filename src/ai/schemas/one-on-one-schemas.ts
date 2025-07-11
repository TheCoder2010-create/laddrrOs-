
/**
 * @fileOverview Zod schemas for the 1-on-1 analysis feature.
 * This file is kept separate to allow its non-async exports (the schemas)
 * to be imported into client components without violating the "use server"
 * directive's constraints.
 */

import { z } from 'zod';

// Base form schema from the UI
export const formSchema = z.object({
  location: z.string().min(1, "Location is required."),
  liveConversation: z.boolean().refine(val => val === true, { message: "You must acknowledge this was a live conversation." }),
  employeeAware: z.boolean().refine(val => val === true, { message: "You must confirm the employee is aware of action items." }),
  primaryFeedback: z.string(),
  feedbackTone: z.enum(["Constructive", "Positive", "Corrective", "Neutral"]),
  employeeAcceptedFeedback: z.enum(["Fully", "Partially", "Not Well"]),
  improvementAreas: z.string().optional(),
  growthRating: z.string().refine(val => ["1","2","3","4","5"].includes(val), { message: "Please select a rating."}),
  showedSignsOfStress: z.enum(["Yes", "No", "Unsure"]),
  stressDescription: z.string().optional(),
  expressedAspirations: z.boolean(),
  aspirationDetails: z.string().optional(),
  didAppreciate: z.boolean(),
  appreciationMessage: z.string().optional(),
  isCrossFunctional: z.boolean(),
  broadcastAppreciation: z.boolean(),
  otherComments: z.string().optional(),
  transcript: z.string().optional().describe("An optional transcript of the conversation, either recorded or uploaded."),
  supervisorName: z.string(),
  employeeName: z.string(),
  oneOnOneId: z.string().optional(),
  // Fields for the new prompt
  conversationRecordingDataUri: z.string().optional().describe("A data URI of the recorded audio."),
  pastDeclinedRecommendationAreas: z.array(z.string()).optional(),
  activeDevelopmentGoals: z.array(z.object({ area: z.string(), title: z.string() })).optional(),
  languageLocale: z.string().default('en'),
}).transform(data => ({
  ...data,
  supervisorNotes: [data.primaryFeedback, data.otherComments].filter(Boolean).join('\n\n'),
  conversationTranscript: data.transcript,
}));


// Zod schema for the AI flow's input, derived and transformed from the form schema
export const AnalyzeOneOnOneInputSchema = formSchema;
export type AnalyzeOneOnOneInput = z.infer<typeof AnalyzeOneOnOneInputSchema>;


// Zod schema for the new, comprehensive structured output from the AI
export const AnalyzeOneOnOneOutputSchema = z.object({
  summary: z.string().describe("A brief summary of the session, including tone, energy, and who led the conversation."),
  leadershipScore: z.number().min(1).max(10).describe("A score from 1-10 rating the supervisor's leadership qualities."),
  effectivenessScore: z.number().min(1).max(10).describe("A score from 1-10 rating the effectiveness of the feedback provided."),
  strengthsObserved: z.array(z.object({
    action: z.string().describe("The positive action taken by the supervisor."),
    example: z.string().describe("A supporting quote or example."),
  })).describe("A list of 2-3 observed strengths of the supervisor during the session."),
  coachingRecommendations: z.array(z.object({
    recommendation: z.string().describe("A concrete suggestion for supervisor improvement."),
    reason: z.string().describe("The reason this recommendation is being made, based on the session."),
  })).describe("A list of 2-3 coaching recommendations for the supervisor."),
  actionItems: z.array(z.object({
    owner: z.enum(["Employee", "Supervisor"]),
    task: z.string(),
    deadline: z.string().optional(),
  })).describe("A list of clear, actionable items for the employee or supervisor, including deadlines if mentioned."),
  coachingImpactAnalysis: z.object({
    analysis: z.string().describe("Analysis of how the supervisor's actions relate to active development goals."),
    completedGoalId: z.string().optional().describe("The ID of the development goal if mastery was demonstrated."),
  }).optional().describe("Analysis of coaching impact against active development goals."),
  missedSignals: z.array(z.string()).optional().describe("A list of subtle signals that the supervisor failed to explore."),
  escalationAlert: z.object({
    summary: z.string().describe("A summary of what was missed or the unaddressed red flag."),
    reason: z.string().describe("Why the issue is important and a recommended micro-learning action. Prefixed with 'RECURRING ISSUE: ' if it matches a past declined area."),
    suggestedAction: z.string().describe("The suggested next action for the manager."),
    severity: z.enum(["low", "medium", "high"]),
  }).optional().describe("An alert generated ONLY if an unaddressed red flag is present."),
  biasFairnessCheck: z.object({
    flag: z.boolean().describe("True if potential bias was detected."),
    details: z.string().optional().describe("Details of the potential bias."),
  }).describe("A check for unconscious bias or power imbalance."),
  localizationCompliance: z.object({
    applied: z.boolean().describe("True if localized norms were applied."),
    locale: z.string().optional().describe("The locale used for analysis."),
  }).describe("Notes on localization compliance."),
  legalDataCompliance: z.object({
    piiOmitted: z.boolean().describe("True if PII was detected and theoretically removed."),
    privacyRequest: z.boolean().describe("True if the employee expressed a desire for privacy."),
  }).describe("Notes on legal and data compliance."),
});

export type AnalyzeOneOnOneOutput = z.infer<typeof AnalyzeOneOnOneOutputSchema>;
