import z from "zod"

export const OtpEmailValidationSchema = z.string().email().optional()
export const OtpPhoneNumberValidationSchema = z.string().regex(/^\+?[0-9]+$/).optional()