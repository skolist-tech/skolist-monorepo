import { z } from "zod";

/**
 * Email/Password login form schema
 */
export const emailLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type EmailLoginFormData = z.infer<typeof emailLoginSchema>;

/**
 * Email signup form schema (password confirmation)
 */
export const emailSignupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be at most 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type EmailSignupFormData = z.infer<typeof emailSignupSchema>;

/**
 * Phone/OTP login form schema
 */
export const phoneLoginSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .regex(
      /^\+?[1-9]\d{9,14}$/,
      "Please enter a valid phone number with country code (e.g., +1234567890)"
    ),
});

export type PhoneLoginFormData = z.infer<typeof phoneLoginSchema>;

/**
 * OTP verification schema
 */
export const otpVerificationSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>;
