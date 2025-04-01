import { z } from "zod";

/**
 * Zod schema that validates a password based on the following rules:
 * 1. At least 8 characters long
 * 2. Contains at least one letter
 * 3. Contains at least one number and/or one symbol
 */
export const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .refine(
    (password) => /[a-zA-Z]/.test(password),
    { message: "Password must contain at least one letter" }
  )
  .refine(
    (password) => /[0-9]|[^a-zA-Z0-9]/.test(password),
    { message: "Password must contain at least one number or symbol" }
  );

/**
 * Validates a password using Zod schema
 * @param {string} password - The password to validate
 * @returns {boolean} True if password meets all criteria, false otherwise
 */
export const validatePassword = (password) => {
  const result = passwordSchema.safeParse(password);
  return result.success;
}

