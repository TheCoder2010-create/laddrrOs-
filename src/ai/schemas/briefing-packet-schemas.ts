/**
 * @fileOverview Zod schemas for the AI-powered pre-1-on-1 briefing packet feature.
 */

import { z } from 'zod';

const PastIssueSchema = z.object({
  date: z.string().describe("The date of the past session."),
  summary: z.string().describe("The AI-generated summary from that session."),
});

const CriticalInsightSchema = z.object({
  date: z.string().describe("The date of the session where the insight was identified."),
  summary: z.string().describe("The summary of the critical insight."),
  status: z.string().describe("The current status of the insight (e.g., 'Pending Supervisor Action')."),
});

const CoachingGoalSchema = z.object({
  area: z.string().describe("The area of the coaching goal (e.g., 'Active Listening')."),
  resource: z.string().describe("The specific activity or resource for the goal."),
  progress: z.number().describe("The completion percentage of the goal."),
});


export const BriefingPacketInputSchema = z.object({
  supervisorName: z.string().describe("The name of the supervisor."),
  employeeName: z.string().describe("The name of the employee."),
  // The following fields are populated by the server-side wrapper function before calling the AI
  pastIssues: z.array(PastIssueSchema).optional().describe("Summaries from the last few 1-on-1 sessions."),
  openCriticalInsights: z.array(CriticalInsightSchema).optional().describe("A list of any unresolved critical insights between the two individuals."),
  coachingGoalsInProgress: z.array(CoachingGoalSchema).optional().describe("The supervisor's active personal development goals."),
});
export type BriefingPacketInput = z.infer<typeof BriefingPacketInputSchema>;


export const BriefingPacketOutputSchema = z.object({
  keyDiscussionPoints: z.array(z.string()).describe("A bulleted list of 2-3 key themes or recurring topics from past sessions to follow up on."),
  outstandingActionItems: z.array(z.string()).describe("A bulleted list summarizing any unresolved critical insights or high-priority action items."),
  coachingOpportunities: z.array(z.string()).describe("A bulleted list suggesting 1-2 ways the supervisor can practice their active coaching goals in this meeting."),
  suggestedQuestions: z.array(z.string()).describe("A bulleted list of 3-4 insightful, open-ended questions for the supervisor to ask."),
});
export type BriefingPacketOutput = z.infer<typeof BriefingPacketOutputSchema>;
