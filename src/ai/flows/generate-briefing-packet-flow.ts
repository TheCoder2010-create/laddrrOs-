
'use server';
/**
 * @fileOverview An AI flow for generating a pre-1-on-1 briefing packet for supervisors.
 *
 * - generateBriefingPacket - A function that takes supervisor and employee names and returns a structured summary.
 */

import { ai } from '@/ai/genkit';
import { BriefingPacketInputSchema, BriefingPacketOutputSchema, type BriefingPacketInput, type BriefingPacketOutput } from '@/ai/schemas/briefing-packet-schemas';
import { getOneOnOneHistory, getActiveCoachingPlansForUser } from '@/services/feedback-service';
import { format, formatDistanceToNow } from 'date-fns';
import type { Role } from '@/hooks/use-role';

export async function generateBriefingPacket(input: { supervisorName: string; employeeName: string; viewerRole: Role; }): Promise<BriefingPacketOutput> {
    // 1. Fetch all relevant data that can be fetched on the client before calling the server flow.
    const allHistory = await getOneOnOneHistory();
    const supervisorActiveGoals = await getActiveCoachingPlansForUser(input.supervisorName);

    // 2. Filter data for the specific supervisor-employee pair
    const relevantHistory = allHistory
        .filter(h => h.supervisorName === input.supervisorName && h.employeeName === input.employeeName)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Extract and format the necessary context for the AI
    const pastIssues = relevantHistory.slice(0, 3).map(h => ({
        date: `${format(new Date(h.date), 'PPP')} (${formatDistanceToNow(new Date(h.date), { addSuffix: true })})`,
        summary: h.analysis.supervisorSummary,
    }));

    const allActionItems = relevantHistory.flatMap(h => 
        h.analysis.actionItems?.map(item => ({
            task: item.task,
            owner: item.owner,
            status: item.status,
            completedAt: item.completedAt ? `${format(new Date(item.completedAt), 'PPP')}` : undefined,
        })) || []
    );

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
    const flowInput: BriefingPacketInput = {
        ...input,
        pastIssues,
        actionItems: allActionItems,
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
  prompt: `You are an expert leadership and performance coach. Your task is to generate a concise, actionable pre-1-on-1 briefing packet. The content MUST be tailored to the person viewing it (the 'viewerRole').

**Context:**
- Supervisor: {{{supervisorName}}}
- Employee: {{{employeeName}}}
- Viewer: {{{viewerRole}}}

**Past 3 Sessions (Supervisor's Summary):**
{{#if pastIssues}}
  {{#each pastIssues}}
  - **Date:** {{this.date}}
    **Summary:** {{this.summary}}
  {{/each}}
{{else}}
- No past sessions found.
{{/if}}

**All Past Action Items:**
{{#if actionItems}}
    {{#each actionItems}}
    - Task: "{{this.task}}" (Owner: {{this.owner}}, Status: {{this.status}}{{#if this.completedAt}}, Completed: {{this.completedAt}}{{/if}})
    {{/each}}
{{else}}
- No action items found.
{{/if}}

**Open Critical Insights (Visible to Supervisor Only):**
{{#if openCriticalInsights}}
  {{#each openCriticalInsights}}
  - **From Session on:** {{this.date}}
    **Insight:** {{this.summary}}
    **Status:** {{this.status}}
  {{/each}}
{{else}}
- No open critical insights.
{{/if}}

**Supervisor's Active Coaching Goals (Visible to Supervisor Only):**
{{#if coachingGoalsInProgress}}
    {{#each coachingGoalsInProgress}}
    - **Goal:** {{this.area}} ({{this.resource}}) - {{this.progress}}% complete
    {{/each}}
{{else}}
- No active coaching goals.
{{/if}}

---

**Your Task:**

Based on the context, generate a JSON output SPECIFICALLY for the '{{{viewerRole}}}'.

**1. actionItemAnalysis**: Analyze all past actionItems. What is the ratio of supervisor vs. employee tasks? What is the completion rate? Are there patterns in the types of tasks assigned? Provide a brief, neutral analysis.

{{#if isEmployeeView}}
**2. talkingPoints**: For the EMPLOYEE. Generate a bulleted list of 2-3 forward-looking talking points they can bring to the meeting. Focus on their progress, recent achievements based on feedback, and potential growth areas they might want to discuss. Frame this positively.

**3. employeeSummary**: For the EMPLOYEE. A very brief, encouraging summary of their journey based on the provided session history.
{{else}}
**2. keyDiscussionPoints**: For the SUPERVISOR. A bulleted list of 2-3 key themes or recurring topics from past sessions. What are the most important things to follow up on?

**3. outstandingActionItems**: For the SUPERVISOR. A bulleted list of any critical unresolved issues, primarily focusing on the "Open Critical Insights". If there are none, state that all critical items are resolved.

**4. coachingOpportunities**: For the SUPERVISOR. A bulleted list suggesting 1-2 ways the supervisor can practice their "Active Coaching Goals" in this upcoming meeting. Be specific.

**5. suggestedQuestions**: For the SUPERVISOR. A bulleted list of 3-4 insightful, open-ended questions the supervisor can ask. These should be inspired by the past issues and goals.
{{/if}}
`,
});

const generateBriefingPacketFlow = ai.defineFlow(
  {
    name: 'generateBriefingPacketFlow',
    inputSchema: BriefingPacketInputSchema,
    outputSchema: BriefingPacketOutputSchema,
  },
  async (input) => {
    const isEmployeeView = input.viewerRole === 'Employee';

    // Augment the input with the boolean flag for the prompt
    const promptInput = {
      ...input,
      isEmployeeView,
    };
    
    const { output } = await prompt(promptInput);

    if (!output) {
      throw new Error("AI analysis failed to produce a briefing packet.");
    }
    return output;
  }
);
