import { z } from "zod";

export const sendOTPValidation = z.object({
  email: z.email("invalid email"),
  username: z
    .string("invalid username")
    .min(1, "username is too short")
    .max(20, "username is too long"),
});

export const verifyOTPValidation = z.object({
  email: z.email("invalid email"),
  username: z
    .string("invalid username")
    .min(1, "username is too short")
    .max(20, "username is too long"),
  otp: z.string("invalid otp").length(6, "otp is too long"),
});
