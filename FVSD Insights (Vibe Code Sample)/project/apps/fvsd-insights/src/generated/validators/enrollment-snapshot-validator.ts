import { z } from 'zod';

/**
 * Zod schema for EnrollmentSnapshot validation
 */
export const EnrollmentSnapshotSchema = z.object({
  id: z.string().uuid(),
  enrollmentSnapshotName: z.string().min(1, { message: "Enrollment Snapshot Name is required" }),
  enrollmentCount: z.number().int(),
  fTE: z.number(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  percentOfSchool: z.number(),
  program: z.object({ id: z.string().uuid(), programName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  schoolYear: z.object({ id: z.string().uuid(), schoolYearName: z.string() }),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
});

/**
 * Schema for creating a new EnrollmentSnapshot (omits system-generated ID)
 */
export const CreateEnrollmentSnapshotSchema = EnrollmentSnapshotSchema.omit({ id: true });

/**
 * Schema for updating an existing EnrollmentSnapshot
 */
export const UpdateEnrollmentSnapshotSchema = EnrollmentSnapshotSchema;

export type EnrollmentSnapshotInput = z.infer<typeof EnrollmentSnapshotSchema>;
export type CreateEnrollmentSnapshotInput = z.infer<typeof CreateEnrollmentSnapshotSchema>;
export type UpdateEnrollmentSnapshotInput = z.infer<typeof UpdateEnrollmentSnapshotSchema>;