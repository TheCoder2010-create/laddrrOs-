'use server';
/**
 * @fileOverview An AI flow for generating a pre-1-on-1 briefing packet for supervisors.
 *
 * - generateBriefingPacket - A function that takes supervisor and employee names and returns a structured summary.
 */

import { ai } from '@/ai/genkit';
import { BriefingPacketInputSchema, BriefingPacketOutputSchema, type BriefingPacketInput, type BriefingPacketOutput } from '@/ai/schemas/briefing-packet-schemas';
import { getOneOnOneHistory, getActiveCoachingPlansForSupervisor } from '@/services/feedback-service';
import { formatDistanceToNow } from 'date-fns';

export async function generateBriefingPacket(input: BriefingPacketInput): Promise<BriefingPacketOutput> {
    // 1. Fetch all relevant data
    const allHistory = await getOneOnOneHistory();
    const supervisorActiveGoals = await getActiveCoachingPlansForSupervisor(input.supervisorName);

    // 2. Filter data for the specific supervisor-employee pair
    const relevantHistory = allHistory
        .filter(h => h.supervisorName === input.supervisorName && h.employeeName === input.employeeName)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Extract and format the necessary context for the AI
    const pastIssues = relevantHistory.slice(0, 3).map(h => ({
        date: `${format(new Date(h.date), 'PPP')} (${formatDistanceToNow(new Date(h.date), { addSuffix: true })})`,
        summary: h.analysis.supervisorSummary,
    }));

    const openCriticalInsights = relevantHistory
        .filter(h => h.analysis.criticalCoachingInsight && h.analysis.criticalCoachingInsight.status !== 'resolved')
        .map(h => ({
            date: format(new Date(h.date), 'PPP'),
            summary: h.analysis.criticalCoachingInsight!.summary,
            status: h.analysis.criticalCoachingInsight!.status.replace(/_/g, ' '),
        }));

    const coachingGoalsInProgress = supervisorActiveGoals.map(p => ({
        area: p.rec.area,
        resource: p.rec.resource,
        progress: p.rec.progress || 0,
    }));
    
    // 4. Call the AI flow with the prepared data
    const flowInput = {
        ...input,
        pastIssues,
        openCriticalInsights,
        coachingGoalsInProgress,
    };
    
    const result = await generateBriefingPacketFlow(flowInput);

    return result;
}


const prompt = ai.definePrompt({
  name: 'generateBriefingPacketPrompt',
  input: { schema: BriefingPacketInputSchema },
  output: { schema: BriefingPacketOutputSchema },
  prompt: `You are an expert leadership coach and AI assistant. Your task is to generate a concise, actionable pre-1-on-1 briefing packet for a supervisor about to meet with their employee.

**Context:**
- Supervisor: {{{supervisorName}}}
- Employee: {{{employeeName}}}

**Past 3 Sessions:**
{{#if pastIssues}}
  {{#each pastIssues}}
  - **Date:** {{this.date}}
    **Summary:** {{this.summary}}
  {{/each}}
{{else}}
- No past sessions found.
{{/if}}

**Open Critical Insights:**
{{#if openCriticalInsights}}
  {{#each openCriticalInsights}}
  - **From Session on:** {{this.date}}
    **Insight:** {{this.summary}}
    **Status:** {{this.status}}
  {{/each}}
{{else}}
- No open critical insights.
{{/if}}

**Supervisor's Active Coaching Goals:**
{{#if coachingGoalsInProgress}}
    {{#each coachingGoalsInProgress}}
    - **Goal:** {{this.area}} ({{this.resource}}) - {{this.progress}}% complete
    {{/each}}
{{else}}
- No active coaching goals.
{{/if}}

**Your Task:**

Based on all the provided context, generate the following JSON output:

1.  **`keyDiscussionPoints`**: A bulleted list of 2-3 key themes or recurring topics from past sessions. What are the most important things to follow up on?
2.  **`outstandingActionItems`**: A bulleted list of any critical unresolved issues, primarily focusing on the "Open Critical Insights". If there are none, state that all critical items are resolved.
3.  **`coachingOpportunities`**: A bulleted list suggesting 1-2 ways the supervisor can practice their "Active Coaching Goals" in this upcoming meeting. Be specific. For example, if their goal is "Active Listening", suggest they try paraphrasing the employee's concerns.
4.  **`suggestedQuestions`**: A bulleted list of 3-4 insightful, open-ended questions the supervisor can ask to facilitate a productive conversation. These should be inspired by the past issues and goals. Examples: "How are you feeling about [past issue] now?", "What's one thing we could do to make progress on [opportunity]?", "What's been most energizing for you lately?".
`,
});

const generateBriefingPacketFlow = ai.defineFlow(
  {
    name: 'generateBriefingPacketFlow',
    inputSchema: BriefingPacketInputSchema,
    outputSchema: BriefingPacketOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI analysis failed to produce a briefing packet.");
    }
    return output;
  }
);
