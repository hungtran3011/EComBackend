import z from "zod"

export const OtpEmailValidationSchema = z.string().email().optional().nullable().default("")
export const OtpPhoneNumberValidationSchema = z.string().regex(/^\+?[0-9]+$/).optional().default("")