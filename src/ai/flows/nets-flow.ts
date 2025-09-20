
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

const prompt = ai.definePrompt({
  name: 'netsConversationPrompt',
  input: { schema: NetsConversationInputSchema },
  output: { schema: z.string().describe("The AI's response in the conversation.") },
  prompt: `You are an AI actor in a role-playing simulation designed to help users practice difficult conversations.

**Your Persona:**
- You are a {{persona}}.
- Your demeanor should be {{difficulty}}.

**The Scenario:**
- The user is practicing the following scenario: "{{scenario}}".
- The user initiated this conversation.

**Your Task:**
- Stay in character at all times.
- Your responses should be realistic and reflect your assigned persona and difficulty.
- Do NOT break character or reveal that you are an AI.
- Do NOT be overly agreeable. If the user is vague, push back. If their tone is poor, react accordingly. Your goal is to provide a realistic challenge.
- Keep your responses concise and conversational.

**Conversation History:**
{{#each history}}
  {{#if (eq this.role "user")}}
    User: {{{this.content}}}
  {{else if (eq this.role "model")}}
    You: {{{this.content}}}
  {{/if}}
{{/each}}

Based on the history, provide your next response as the {{persona}}.`,
});

const runNetsConversationFlow = ai.defineFlow(
  {
    name: 'runNetsConversationFlow',
    inputSchema: NetsConversationInputSchema,
    outputSchema: NetsMessageSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The AI failed to generate a response for the simulation.");
    }
    
    return {
      role: 'model',
      content: output,
    };
  }
);
