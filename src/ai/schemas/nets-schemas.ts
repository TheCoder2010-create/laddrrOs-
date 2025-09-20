
/**
 * @fileOverview Zod schemas for the "Nets" conversation simulation feature.
 */

import { z } from 'zod';

export const NetsMessageSchema = z.object({
  role: z.enum(["user", "model", "system"]),
  content: z.string(),
});
export type NetsMessage = z.infer<typeof NetsMessageSchema>;

export const NetsInitialInputSchema = z.object({
  scenario: z.string().describe("The user-defined scenario for the conversation."),
  persona: z.string().describe("The persona the AI should adopt, e.g., 'Team Lead'."),
  difficulty: z.string().describe("The difficulty level of the conversation, e.g., 'Strict'."),
});
export type NetsInitialInput = z.infer<typeof NetsInitialInputSchema>;

export const NetsConversationInputSchema = NetsInitialInputSchema.extend({
  history: z.array(NetsMessageSchema).describe("The conversation history so far."),
});
export type NetsConversationInput = z.infer<typeof NetsConversationInputSchema>;
