import { z } from 'zod';

// Phone number validation (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Authentication schemas
export const signupSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, 'Please enter a valid international phone number')
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, 'Please enter a valid international phone number')
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

// JWT token schema
export const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// User update schema
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(50, 'Name cannot exceed 50 characters')
      .trim()
      .optional(),
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .optional(),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters long')
      .max(100, 'New password cannot exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'New password must contain at least one lowercase letter, one uppercase letter, and one number'
      )
      .optional(),
  })
  .refine(
    data => {
      // If updating password, both current and new password are required
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      if (data.currentPassword && !data.newPassword) {
        return false;
      }
      return true;
    },
    {
      message:
        'Both current password and new password are required when updating password',
      path: ['currentPassword', 'newPassword'],
    }
  );

// Export types
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TokenInput = z.infer<typeof tokenSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
