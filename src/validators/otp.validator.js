import z from "zod"

export const OtpEmailValidationSchema = z.string().email()
export const OtpPhoneNumberValidationSchema = z.string().regex(/^\+?[0-9]+$/)