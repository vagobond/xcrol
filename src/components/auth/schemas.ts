import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const signUpSchema = z.object({
  displayName: z.string()
    .trim()
    .min(1, { message: "Display name is required" })
    .max(50, { message: "Display name must be 50 characters or less" }),
  email: z.string().trim().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" }),
  inviteCode: z.string().trim().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the Terms and Privacy Policy" }),
  }),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type AuthView = "default" | "forgot-password" | "reset-password-sent" | "update-password" | "email-not-confirmed" | "waitlist";

export type AuthErrors = {
  email?: string;
  password?: string;
  displayName?: string;
  confirmPassword?: string;
  inviteCode?: string;
  agreedToTerms?: string;
};
