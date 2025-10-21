'use server';
/**
 * @fileOverview An AI flow for generating a targeted leadership survey based on organizational feedback.
 */

import { ai } from '@/ai/genkit';
import { GenerateLeadershipPulseInputSchema, GenerateLeadershipPulseOutputSchema, type GenerateLeadershipPulseInput, type GenerateLeadershipPulseOutput } from '@/ai/schemas/leadership-pulse-schemas';

export async function generateLeadershipPulse(input: GenerateLeadershipPulseInput): Promise<GenerateLeadershipPulseOutput> {
  return generateLeadershipPulseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLeadershipPulsePrompt',
  input: { schema: GenerateLeadershipPulseInputSchema },
  output: { schema: GenerateLeadershipPulseOutputSchema },
  prompt: `You are an expert in organizational development and leadership coaching. You have been given the results of an anonymous employee survey. Your task is to generate a short, targeted follow-up survey for leadership roles (Team Leads, AMs, Managers) to diagnose the root causes of the employee feedback.

**Anonymous Survey Objective:** "{{surveyObjective}}"

**AI-Generated Summary of Anonymous Feedback:**
- **Overall Sentiment:** {{anonymousSurveySummary.overallSentiment}}
- **Key Themes:**
  {{#each anonymousSurveySummary.keyThemes}}
  - **{{this.theme}}**: {{this.summary}}
  {{/each}}
- **Recommendations:**
  {{#each anonymousSurveySummary.recommendations}}
  - {{this}}
  {{/each}}

**Your Task:**
Based on the summary above, create a list of 3-5 insightful, multiple-choice or rating-scale questions for leaders. These questions should help clarify the "why" behind the employee sentiment. For each question, provide a brief justification for why it's being asked.

**Example Question Format:**
- questionText: "How confident are you in your team's understanding of our current project priorities? (1-5 scale)"
- type: "rating"
- reasoning: "This question probes into the 'Clarity from Leadership' theme and helps determine if communication gaps exist."
- options: ["1 - Not Confident", "2", "3 - Somewhat Confident", "4", "5 - Very Confident"]

Generate the JSON output with the 'questions' array for the leadership pulse survey now. The questions should be for the leaders, not the employees.`,
});

const generateLeadershipPulseFlow = ai.defineFlow(
  {
    name: 'generateLeadershipPulseFlow',
    inputSchema: GenerateLeadershipPulseInputSchema,
    outputSchema: GenerateLeadershipPulseOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI failed to generate leadership pulse questions.");
    }
    // Add unique IDs to each question post-generation
    output.questions.forEach(q => q.id = q.id || uuidv4());
    return output;
  }
);
