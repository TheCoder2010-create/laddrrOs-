
'use server';
/**
 * @fileOverview An AI flow for analyzing 1-on-1 feedback sessions.
 *
 * - analyzeOneOnOne - A function that takes form data from a 1-on-1 and returns a structured analysis.
 * - AnalyzeOneOnOneInput - The input type for the analyzeOneOnOne function.
 * - AnalyzeOneOnOneOutput - The return type for the analyzeOneOnOne function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Zod schema for the input, matching the frontend form structure
export const AnalyzeOneOnOneInputSchema = z.object({
  location: z.string(),
  liveConversation: z.boolean(),
  employeeAware: z.boolean(),
  primaryFeedback: z.string(),
  feedbackTone: z.enum(["Constructive", "Positive", "Corrective", "Neutral"]),
  employeeAcceptedFeedback: z.enum(["Fully", "Partially", "Not Well"]),
  improvementAreas: z.string().optional(),
  growthRating: z.string(),
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
});

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

export async function analyzeOneOnOne(input: AnalyzeOneOnOneInput): Promise<AnalyzeOneOnOneOutput> {
  return analyzeOneOnOneFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeOneOnOnePrompt',
  input: { schema: AnalyzeOneOnOneInputSchema },
  output: { schema: AnalyzeOneOnOneOutputSchema },
  prompt: `You are an expert HR analyst and executive coach. Your task is to analyze the provided 1-on-1 session feedback and generate a structured, insightful summary.

Here is the data from the session:
- **Location**: {{{location}}}
- **Feedback Tone**: {{{feedbackTone}}}
- **How Feedback Was Received**: {{{employeeAcceptedFeedback}}}
- **Growth/Performance Rating (1-5)**: {{{growthRating}}}
- **Signs of Stress**: {{{showedSignsOfStress}}}{{#if stressDescription}} (Details: {{{stressDescription}}}){{/if}}
- **Expressed Aspirations**: {{#if expressedAspirations}}Yes{{#if aspirationDetails}} (Details: {{{aspirationDetails}}}){{/if}}{{else}}No{{/if}}
- **Appreciation Given**: {{#if didAppreciate}}Yes{{#if appreciationMessage}} (Message: {{{appreciationMessage}}}){{/if}}{{else}}No{{/if}}

**Primary Feedback & Key Points Discussed**:
<feedback>
{{{primaryFeedback}}}
</feedback>

**Specific Improvement Areas Mentioned**:
<improvement>
{{{improvementAreas}}}
</improvement>

**Other Comments**:
<comments>
{{{otherComments}}}
</comments>

{{#if transcript}}
**Conversation Transcript**:
<transcript>
{{{transcript}}}
</transcript>
{{/if}}

Based on ALL the information provided, perform the following analysis and provide the output in the requested JSON format:

1.  **keyThemes**: Identify the 3-5 most important themes. These could be about performance, goals, challenges, or morale.
2.  **actionItems**: Extract or infer clear, actionable next steps. Assign ownership if possible (e.g., "Supervisor to schedule follow-up," "Employee to research training courses").
3.  **sentimentAnalysis**: Briefly describe the overall mood. Was it tense, collaborative, positive, etc.? Consider the employee's reception of feedback and any signs of stress.
4.  **escalationAlert**: CRITICAL: Scrutinize the input for any red flags that might require HR intervention. This includes mentions of harassment, discrimination, extreme burnout, clear intent to quit, or serious policy violations. If found, formulate a concise, professional alert. If no such flags are present, OMIT this field entirely.
5.  **coachingImpactAnalysis**: Based on the employee's feedback, reception, and aspirations, suggest the single most impactful area for the supervisor to focus their coaching efforts. For example, "Focus on building confidence through smaller, quick wins" or "Help the employee network with other teams to explore their career aspirations."
`,
});

const analyzeOneOnOneFlow = ai.defineFlow(
  {
    name: 'analyzeOneOnOneFlow',
    inputSchema: AnalyzeOneOnOneInputSchema,
    outputSchema: AnalyzeOneOnOneOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI analysis failed to produce an output.");
    }
    return output;
  }
);

    