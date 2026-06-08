import { z } from "zod";

export const createInterviewSchema = z.object({
  candidateId: z.string().min(1, "A candidate is required."),
});

export const submitAnswerSchema = z.object({
  answer: z.string().trim().min(1, "Please provide an answer before continuing."),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
