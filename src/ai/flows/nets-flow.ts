
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
- You are playing the role of a {{persona}}.
- Your demeanor should be {{difficulty}}.

**The Scenario:**
- The user wants to practice the following scenario they have described: "{{scenario}}".
- The user initiated this conversation.

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

const runNetsConversationFlow = ai.defineFlow(
  {
    name: 'runNetsConversationFlow',
    inputSchema: NetsConversationInputSchema,
    outputSchema: NetsMessageSchema,
  },
  async (input) => {
    // Genkit's Handlebars implementation doesn't support complex helpers like 'eq'.
    // We need to pre-process the history to make it directly usable by the template.
    const processedHistory = input.history.map(msg => ({
      isUser: msg.role === 'user',
      isModel: msg.role === 'model',
      content: msg.content,
    }));
    
    const promptInput = {
      ...input,
      // The prompt now uses a different structure for history
      history: processedHistory,
    };

    const { output } = await prompt(promptInput);

    if (!output) {
      throw new Error("The AI failed to generate a response for the simulation.");
    }
    
    return {
      role: 'model',
      content: output,
    };
  }
);
