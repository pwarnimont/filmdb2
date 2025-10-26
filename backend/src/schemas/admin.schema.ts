import {z} from 'zod';

export const updateRegistrationSchema = z.object({
  allowRegistration: z.boolean()
});

export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;

export const adminUserUpdateSchema = z
  .object({
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional()
  })
  .refine((data) => data.role !== undefined || data.isActive !== undefined, {
    message: 'No changes provided'
  });

export const adminUserPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserPasswordInput = z.infer<typeof adminUserPasswordSchema>;
