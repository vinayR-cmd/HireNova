import { z } from "zod";

export const createJobPostingSchema = z.object({
  title: z.string().min(2, "Job title must be at least 2 characters.").max(120),
  department: z.string().min(1, "Department is required."),
  designation: z.string().min(1, "Designation is required."),
  description: z.string().min(20, "Provide a meaningful job description (at least 20 characters)."),
  requiredSkills: z.array(z.string().min(1)).min(1, "List at least one required skill."),
  experienceLevel: z.string().min(1, "Experience level is required."),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).default("FULL_TIME"),
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).default("OPEN"),
});

export const candidateApplicationSchema = z.object({
  jobPostingId: z.string().min(1, "A job posting is required."),
  fullName: z.string().min(2, "Candidate name is required."),
  email: z.string().email("Please provide a valid email address."),
  phone: z.string().optional(),
});

export type CreateJobPostingInput = z.infer<typeof createJobPostingSchema>;
export type CandidateApplicationInput = z.infer<typeof candidateApplicationSchema>;
