import { z } from 'zod';

/**
 * Zod schema for StudentGroup validation
 */
export const StudentGroupSchema = z.object({
  id: z.string().uuid(),
  studentGroupName: z.string().min(1, { message: "Student Group Name is required" }),
  description: z.string().optional(),
  groupTypeKey: z.enum(['All', 'Indigenous', 'EnglishLanguageLearner', 'DiverseAbilities', 'CareStatus']),
  isPriorityGroup: z.boolean(),
});

/**
 * Schema for creating a new StudentGroup (omits system-generated ID)
 */
export const CreateStudentGroupSchema = StudentGroupSchema.omit({ id: true });

/**
 * Schema for updating an existing StudentGroup
 */
export const UpdateStudentGroupSchema = StudentGroupSchema;

export type StudentGroupInput = z.infer<typeof StudentGroupSchema>;
export type CreateStudentGroupInput = z.infer<typeof CreateStudentGroupSchema>;
export type UpdateStudentGroupInput = z.infer<typeof UpdateStudentGroupSchema>;