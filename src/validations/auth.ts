import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email address is required.")
    .email("Please provide a valid email format."),
  password: z
    .string()
    .min(1, "Password field cannot be blank.")
    .min(6, "Password must contain at least 6 characters."),
});

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full legal name is required.")
    .min(2, "Name must be at least 2 characters long.")
    .max(50, "Name cannot exceed 50 characters."),
  email: z
    .string()
    .min(1, "Corporate or personal email is required.")
    .email("Invalid email layout structure."),
  mobile: z
    .string()
    .min(1, "Mobile phone connection number is required.")
    .regex(/^[0-9+]{10,14}$/, "Please input a valid phone index number (10-14 digits)."),
  password: z
    .string()
    .min(1, "A secure system password is required.")
    .min(8, "Password security parameters require at least 8 elements.")
    .regex(/[A-Z]/, "Password must incorporate at least one uppercase letter.")
    .regex(/[0-9]/, "Password must include at least one numeric character."),
  desiredDepartment: z
    .string()
    .min(1, "Please highlight a target prospective department operational node."),
  desiredDesignation: z
    .string()
    .min(1, "Please define your corresponding target occupational designation title."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;