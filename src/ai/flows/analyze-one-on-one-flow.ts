
'use server';
/**
 * @fileOverview An AI flow for analyzing 1-on-1 feedback sessions.
 *
 * - analyzeOneOnOne - A function that takes form data from a 1-on-1 and returns a structured analysis.
 */

import { ai } from '@/ai/genkit';
import { AnalyzeOneOnOneInputSchema, AnalyzeOneOnOneOutputSchema, type AnalyzeOneOnOneInput, type AnalyzeOneOnOneOutput } from '@/ai/schemas/one-on-one-schemas';
import { saveFeedback } from '@/services/feedback-service';
import { v4 as uuidv4 } from 'uuid';
import { getRoleByName } from '@/lib/role-mapping';

export async function analyzeOneOnOne(input: AnalyzeOneOnOneInput): Promise<AnalyzeOneOnOneOutput> {
  const result = await analyzeOneOnOneFlow(input);
  const submittedAt = new Date();
  
  const supervisorRole = getRoleByName(input.supervisorName);
  const employeeRole = getRoleByName(input.employeeName);

  if (!supervisorRole || !employeeRole) {
      console.error("Could not determine roles for supervisor or employee. Aborting insight creation.");
      return result;
  }

  // If a critical insight is found, create a new feedback record to trigger the workflow.
  if (result.criticalCoachingInsight && input.oneOnOneId) {
      const allFeedback = [];
      const newFeedback = {
          trackingId: uuidv4(),
          oneOnOneId: input.oneOnOneId, // Link the feedback to the 1-on-1
          subject: `Critical Coaching Insight from 1-on-1 with ${input.employeeName}`,
          message: `A critical coaching insight was identified during a 1-on-1 session between ${input.supervisorName} and ${input.employeeName}. See details below.
          
- **Location**: ${input.location}
- **Feedback Tone**: ${input.feedbackTone}
- **How Feedback Was Received**: ${input.employeeAcceptedFeedback}
- **Primary Feedback**: ${input.supervisorNotes || 'N/A'}`,
          submittedAt: submittedAt,
          summary: result.criticalCoachingInsight.summary,
          criticality: 'Critical' as const,
          criticalityReasoning: result.criticalCoachingInsight.reason,
          viewed: false,
          status: 'Pending Supervisor Action' as const,
          assignedTo: supervisorRole,
          supervisor: supervisorRole,
          employee: employeeRole,
          auditTrail: [
              {
                  event: 'Critical Insight Identified',
                  timestamp: submittedAt,
                  actor: 'HR Head' as const, // System action attributed to HR
                  details: 'Critical coaching insight automatically logged from 1-on-1 analysis.',
              },
               {
                  event: 'Assigned',
                  timestamp: new Date(submittedAt.getTime() + 1000),
                  actor: 'HR Head' as const,
                  details: `Case automatically assigned to ${supervisorRole} for initial response.`,
              },
          ],
      };
      
      allFeedback.unshift(newFeedback as any);
      await saveFeedback(allFeedback, true); // Use append mode
  }
  
  // If there are action items, create a "To-Do" feedback item for the supervisor.
  if (result.actionItems && result.actionItems.length > 0) {
      const allFeedback = [];
      const newActionItemRecord = {
          trackingId: uuidv4(),
          oneOnOneId: input.oneOnOneId,
          subject: `Action Items from 1-on-1 with ${input.employeeName}`,
          message: `The following action items were generated from your 1-on-1 on ${new Date().toLocaleDateString()}.`,
          submittedAt: submittedAt,
          criticality: 'Low' as const,
          status: 'To-Do' as const,
          assignedTo: supervisorRole,
          supervisor: supervisorRole,
          employee: employeeRole,
          viewed: true,
          actionItems: result.actionItems.map(itemText => ({
              id: uuidv4(),
              text: itemText.task,
              status: 'pending' as const,
              owner: itemText.owner === 'Supervisor' ? supervisorRole : employeeRole,
          })),
          auditTrail: [
              {
                  event: 'To-Do List Created',
                  timestamp: submittedAt,
                  actor: 'HR Head' as const, // System action
                  details: 'Action items were generated from 1-on-1 analysis and assigned to the supervisor.',
              }
          ]
      };
      allFeedback.unshift(newActionItemRecord as any);
      await saveFeedback(allFeedback, true); // Use append mode
  }
  
  return result;
}

const prompt = ai.definePrompt({
  name: 'analyzeOneOnOnePrompt',
  input: { schema: AnalyzeOneOnOneInputSchema },
  output: { schema: AnalyzeOneOnOneOutputSchema },
  prompt: `You are an expert organizational coach, licensed behavioral analyst, and AI-powered leadership assistant. Your task is to analyze a 1-on-1 conversation between a supervisor and employee. Use the provided audio, transcript, and/or notes to create a comprehensive JSON report. This report will be used for coaching, compliance monitoring, and continuous leadership development. Your analysis must remain objective, bias-aware, privacy-compliant, and contextually accurate.

Inputs You Will Receive:

Supervisor's Notes: {{{supervisorNotes}}}
{{#if conversationTranscript}}
Conversation Transcript: {{{conversationTranscript}}}
{{/if}}
{{#if conversationRecordingDataUri}}
Audio Recording (Primary source of truth): {{media url=conversationRecordingDataUri}}
{{/if}}
Past Declined Coaching Areas: {{#if pastDeclinedRecommendationAreas}}{{#each pastDeclinedRecommendationAreas}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}None{{/if}}
Active Development Goals: {{#if activeDevelopmentGoals}}{{#each activeDevelopmentGoals}}{{this.area}}: {{this.title}}{{/each}}{{else}}None{{/if}}
Language Locale: {{languageLocale}}

Analysis Instructions:

If the input is empty or non-meaningful (e.g., silence, test phrases), return a JSON with summary "Insufficient input for analysis.", scores set to 1, and an explanation. Otherwise, generate the full report:

Session Summary: Quote 1-2 key phrases to anchor the summary. Describe the tone, energy, clarity, and who led the conversation more (employee/supervisor).
Leadership Score (1-10): Rate based on empathy, clarity, and ownership. Ask yourself: "Would I follow this person as a leader?"
Effectiveness Score (1-10): Rate based on whether feedback was useful, specific, actionable, growth-oriented, and if the employee left with clear next steps.
Strengths Observed: List 2-3 specific positive actions by the supervisor, with supporting quotes as examples.
Coaching Recommendations: Provide 2-3 concrete suggestions for the supervisor to improve, based on weaknesses in this session.
Action Items: List all concrete tasks for both employee and supervisor, including deadlines if stated.
Coaching Impact Analysis: (Only if activeDevelopmentGoals are provided) Analyze if the supervisor showed growth towards a goal. If so, summarize the application with a supporting quote. If mastery is shown, return the completedGoalId.
Missed Signals: Identify any subtle indications of disengagement, burnout, confusion, or unspoken ambition that the supervisor failed to explore.
Critical Coaching Insight: (Generate ONLY if an unaddressed red flag is present. If no flag is present, OMIT this field from the JSON.)
Trigger Conditions: Repeated complaints, ignored aspirations, unresolved conflict, emotional distress, or potential HR issues.
Content: Must include a summary (what was missed), reason (why it matters AND a recommended micro-learning action), suggestedAction for the manager, and severity.
If a declined coaching area matches the issue, prepend the reason with "RECURRING ISSUE: " and set severity to "high".
Bias/Fairness Check: Flag any language indicating unconscious bias or power imbalance (e.g., "You always..."). Use cultural sensitivity based on locale.
Localization Compliance: If languageLocale is not 'en', note that analysis applied localized norms.
Legal & Data Compliance: Set piiOmitted to true if any PII was detected and removed. Set privacyRequest to true if the employee expressed a desire for privacy.
Generate the complete, compliant, and objective report now.`,
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
    
