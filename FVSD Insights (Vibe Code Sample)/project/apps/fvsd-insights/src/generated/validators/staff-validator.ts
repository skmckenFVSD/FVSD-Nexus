import { z } from 'zod';

/**
 * Zod schema for Staff validation
 */
export const StaffSchema = z.object({
  id: z.string().uuid(),
  staffName: z.string().min(1, { message: "Staff Name is required" }),
  email: z.string().email().min(1, { message: "Email is required" }),
  isActive: z.boolean(),
  manager: z.object({ id: z.string().uuid(), staffName: z.string() }).optional(),
  phone: z.string().optional(),
  roleKey: z.enum(['Principal', 'VicePrincipal', 'DistrictLeader', 'LearningSupportTeacher', 'DataAnalyst']),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
});

/**
 * Schema for creating a new Staff (omits system-generated ID)
 */
export const CreateStaffSchema = StaffSchema.omit({ id: true });

/**
 * Schema for updating an existing Staff
 */
export const UpdateStaffSchema = StaffSchema;

export type StaffInput = z.infer<typeof StaffSchema>;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;