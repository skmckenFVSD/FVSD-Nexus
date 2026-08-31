import { z } from 'zod';

/**
 * Zod schema for Program validation
 */
export const ProgramSchema = z.object({
  id: z.string().uuid(),
  programName: z.string().min(1, { message: "Program Name is required" }),
  description: z.string().optional(),
  isActive: z.boolean(),
  programTypeKey: z.enum(['Regular', 'FrenchImmersion', 'IndigenousEducation', 'InclusiveEducation', 'CareerEducation']),
});

/**
 * Schema for creating a new Program (omits system-generated ID)
 */
export const CreateProgramSchema = ProgramSchema.omit({ id: true });

/**
 * Schema for updating an existing Program
 */
export const UpdateProgramSchema = ProgramSchema;

export type ProgramInput = z.infer<typeof ProgramSchema>;
export type CreateProgramInput = z.infer<typeof CreateProgramSchema>;
export type UpdateProgramInput = z.infer<typeof UpdateProgramSchema>;