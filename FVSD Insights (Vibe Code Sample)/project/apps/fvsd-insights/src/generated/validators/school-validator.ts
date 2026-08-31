import { z } from 'zod';

/**
 * Zod schema for School validation
 */
export const SchoolSchema = z.object({
  id: z.string().uuid(),
  schoolName: z.string().min(1, { message: "School Name is required" }),
  capacity: z.number().int(),
  isActive: z.boolean(),
  municipality: z.string().min(1, { message: "Municipality is required" }),
  province: z.string().min(1, { message: "Province is required" }),
  regionKey: z.enum(['CentralFraser', 'EastValley', 'WestValley', 'NorthRural']),
  schoolNumber: z.string().min(1, { message: "School Number is required" }),
  schoolTypeKey: z.enum(['Elementary', 'Middle', 'Secondary', 'K12']),
});

/**
 * Schema for creating a new School (omits system-generated ID)
 */
export const CreateSchoolSchema = SchoolSchema.omit({ id: true });

/**
 * Schema for updating an existing School
 */
export const UpdateSchoolSchema = SchoolSchema;

export type SchoolInput = z.infer<typeof SchoolSchema>;
export type CreateSchoolInput = z.infer<typeof CreateSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof UpdateSchoolSchema>;