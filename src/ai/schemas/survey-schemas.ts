/**
 * @fileOverview Zod schemas for the anonymous survey generation feature.
 */

import { z } from 'zod';

export const GenerateSurveyQuestionsInputSchema = z.object({
  objective: z.string().describe("The high-level objective of the survey."),
});
export type GenerateSurveyQuestionsInput = z.infer<typeof GenerateSurveyQuestionsInputSchema>;

export const SurveyQuestionSchema = z.object({
    id: z.string().optional().describe("Unique ID for the question, added post-generation."),
    questionText: z.string().describe("The exact text of the question to be asked."),
    reasoning: z.string().describe("The reasoning behind why this question is valuable and what it helps measure."),
    isCustom: z.boolean().optional().default(false).describe("Flag to indicate if the question was added by the user."),
});
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;

export const GenerateSurveyQuestionsOutputSchema = z.object({
  questions: z.array(SurveyQuestionSchema).describe("An array of suggested survey questions."),
});
export type GenerateSurveyQuestionsOutput = z.infer<typeof GenerateSurveyQuestionsOutputSchema>;


export const DeployedSurveySchema = z.object({
    id: z.string(),
    objective: z.string(),
    questions: z.array(SurveyQuestionSchema),
    deployedAt: z.string(),
    status: z.enum(['active', 'closed']),
    submissionCount: z.number().default(0),
});
export type DeployedSurvey = z.infer<typeof DeployedSurveySchema>;
