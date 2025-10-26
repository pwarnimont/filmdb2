import {z} from 'zod';

export const updateRegistrationSchema = z.object({
  allowRegistration: z.boolean()
});

export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;

export const adminUserUpdateSchema = z
  .object({
    role: z.enum(['USER', 'ADMIN']).optional(),
    isActive: z.boolean().optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional()
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'No changes provided'
  });

export const adminUserPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const adminUserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
  isActive: z.boolean().default(true)
});

export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminUserPasswordInput = z.infer<typeof adminUserPasswordSchema>;
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;
