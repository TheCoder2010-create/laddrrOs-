
'use server';
/**
 * @fileOverview An AI flow for running conversation simulations in "Nets".
 *
 * - runNetsConversation - A function that takes the simulation config and conversation history, and returns the AI's next response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { NetsConversationInputSchema, NetsMessageSchema, type NetsConversationInput } from '@/ai/schemas/nets-schemas';

export async function runNetsConversation(input: NetsConversationInput): Promise<z.infer<typeof NetsMessageSchema>> {
  return runNetsConversationFlow(input);
}

const continueConversationPrompt = ai.definePrompt({
  name: 'netsContinueConversationPrompt',
  input: { schema: NetsConversationInputSchema },
  output: { schema: z.string().describe("The AI's response in the conversation.") },
  prompt: `You are an AI actor in a role-playing simulation designed to help users practice difficult conversations.

**Your Persona:**
- You are playing the role of a {{persona}}.
- Your demeanor should be {{difficulty}}.

**The Scenario:**
- The user wants to practice the following scenario they have described: "{{scenario}}".

**Your Task:**
- Stay in character as the {{persona}} at all times.
- Your responses should be realistic and reflect your assigned role and difficulty.
- Do NOT break character or reveal that you are an AI.
- Do NOT be overly agreeable. If the user is vague, push back. If their tone is poor, react accordingly. Your goal is to provide a realistic challenge.
- Keep your responses concise and conversational.

**Conversation History:**
{{#each history}}
  {{#if this.isUser}}
    User: {{{this.content}}}
  {{else if this.isModel}}
    You: {{{this.content}}}
  {{/if}}
{{/each}}

Based on the history, provide your next response as the {{persona}}.`,
});

const startConversationPrompt = ai.definePrompt({
  name: 'netsStartConversationPrompt',
  input: { schema: z.object({ persona: z.string(), scenario: z.string(), difficulty: z.string() }) },
  output: { schema: z.string().describe("The AI's first response in the conversation.") },
  prompt: `You are an AI actor in a role-playing simulation. Your task is to start a conversation.

**Your Persona:**
- You are playing the role of a {{persona}}.
- Your demeanor should be {{difficulty}}.

**The Scenario:**
- The user wants to practice the following scenario they have described: "{{scenario}}".

**Your Task:**
- Generate ONLY the first line of the conversation from your perspective as the {{persona}}.
- Do NOT wait for the user to speak. Your response should be the opening statement.
- Keep your response concise and conversational.

For example, if the scenario is "giving feedback about missed deadlines," a good opening might be "Hi, thanks for joining. I wanted to chat about the recent project deadlines."

Generate your opening line now.`
});

const runNetsConversationFlow = ai.defineFlow(
  {
    name: 'runNetsConversationFlow',
    inputSchema: NetsConversationInputSchema,
    outputSchema: NetsMessageSchema,
  },
  async (input) => {
    let output: string | null = null;
    
    if (input.history.length === 0) {
      // This is the first turn. Try to get an initial response.
      const { output: startOutput } = await startConversationPrompt({
        persona: input.persona,
        scenario: input.scenario,
        difficulty: input.difficulty
      });

      // If the AI fails for any reason (e.g., returns null), use a safe fallback.
      // This prevents the schema validation error.
      output = startOutput || `Hi, you wanted to chat about: "${input.scenario}"?`;

    } else {
      // This is a subsequent turn, continue the conversation.
      const processedHistory = input.history.map(msg => ({
        isUser: msg.role === 'user',
        isModel: msg.role === 'model',
        content: msg.content,
      }));
      
      const promptInput = {
        ...input,
        history: processedHistory,
      };

      const { output: continueOutput } = await continueConversationPrompt(promptInput);
      output = continueOutput;
    }

    if (!output) {
      // This is a secondary fallback in case the continuation prompt also fails.
      console.error("The AI failed to generate a response for the simulation. Using a generic fallback.");
      output = "I'm sorry, I'm not sure how to respond to that. Could you try rephrasing?";
    }
    
    return {
      role: 'model',
      content: output,
    };
  }
);
