import { z } from 'zod';

/**
 * Zod schema for GradeBand validation
 */
export const GradeBandSchema = z.object({
  id: z.string().uuid(),
  gradeBandName: z.string().min(1, { message: "Grade Band Name is required" }),
  maximumGrade: z.string().min(1, { message: "Maximum Grade is required" }),
  minimumGrade: z.string().min(1, { message: "Minimum Grade is required" }),
  sortOrder: z.number().int(),
});

/**
 * Schema for creating a new GradeBand (omits system-generated ID)
 */
export const CreateGradeBandSchema = GradeBandSchema.omit({ id: true });

/**
 * Schema for updating an existing GradeBand
 */
export const UpdateGradeBandSchema = GradeBandSchema;

export type GradeBandInput = z.infer<typeof GradeBandSchema>;
export type CreateGradeBandInput = z.infer<typeof CreateGradeBandSchema>;
export type UpdateGradeBandInput = z.infer<typeof UpdateGradeBandSchema>;