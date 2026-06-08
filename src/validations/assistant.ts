import { z } from "zod";

export const assistantChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1),
      })
    )
    .min(1, "At least one message is required.")
    .max(30, "Conversation history is too long."),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
