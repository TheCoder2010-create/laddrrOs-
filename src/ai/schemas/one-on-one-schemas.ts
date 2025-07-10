
/**
 * @fileOverview Zod schemas for the 1-on-1 analysis feature.
 * This file is kept separate to allow its non-async exports (the schemas)
 * to be imported into client components without violating the "use server"
 * directive's constraints.
 */

import { z } from 'zod';

// Zod schema for the form data input
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
  oneOnOneId: z.string().optional(), // Added to link feedback to 1-on-1
}).superRefine((data, ctx) => {
    if (!data.primaryFeedback && !data.transcript) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please provide either primary feedback or a recording/transcript.",
            path: ["primaryFeedback"],
        });
    }
    if (data.primaryFeedback && data.primaryFeedback.length > 0 && data.primaryFeedback.length < 10) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Please provide substantive feedback (at least 10 characters).",
            path: ["primaryFeedback"],
        });
    }
}).refine(data => data.feedbackTone !== 'Corrective' || (data.improvementAreas && data.improvementAreas.length > 0), {
  message: "Improvement areas are required for corrective feedback.",
  path: ["improvementAreas"],
});

// Zod schema for the AI flow's input, derived from the form schema
export const AnalyzeOneOnOneInputSchema = formSchema;
export type AnalyzeOneOnOneInput = z.infer<typeof AnalyzeOneOnOneInputSchema>;

// Zod schema for the structured output we want from the AI
export const AnalyzeOneOnOneOutputSchema = z.object({
  keyThemes: z.array(z.string()).describe("A list of 3-5 key themes that emerged from the conversation."),
  actionItems: z.array(z.string()).describe("A list of clear, actionable items for the employee or supervisor."),
  sentimentAnalysis: z.string().describe("A brief analysis of the overall sentiment and tone of the conversation."),
  escalationAlert: z.string().optional().describe("If the conversation contains red flags (e.g., mentions of harassment, burnout, quitting), provide a concise alert. Otherwise, this should be omitted."),
  coachingImpactAnalysis: z.string().optional().describe("Identify one key area where the supervisor's coaching could have the most impact, based on the feedback."),
});

export type AnalyzeOneOnOneOutput = z.infer<typeof AnalyzeOneOnOneOutputSchema>;
