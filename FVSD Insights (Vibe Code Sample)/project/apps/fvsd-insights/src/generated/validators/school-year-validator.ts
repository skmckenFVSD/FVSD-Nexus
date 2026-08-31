import { z } from 'zod';

/**
 * Zod schema for SchoolYear validation
 */
export const SchoolYearSchema = z.object({
  id: z.string().uuid(),
  schoolYearName: z.string().min(1, { message: "School Year Name is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "End Date is required" }),
  isCurrent: z.boolean(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
});

/**
 * Schema for creating a new SchoolYear (omits system-generated ID)
 */
export const CreateSchoolYearSchema = SchoolYearSchema.omit({ id: true });

/**
 * Schema for updating an existing SchoolYear
 */
export const UpdateSchoolYearSchema = SchoolYearSchema;

export type SchoolYearInput = z.infer<typeof SchoolYearSchema>;
export type CreateSchoolYearInput = z.infer<typeof CreateSchoolYearSchema>;
export type UpdateSchoolYearInput = z.infer<typeof UpdateSchoolYearSchema>;