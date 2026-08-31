import { z } from 'zod';

/**
 * Zod schema for StudentSuccessCohort validation
 */
export const StudentSuccessCohortSchema = z.object({
  id: z.string().uuid(),
  studentSuccessCohortName: z.string().min(1, { message: "Student Success Cohort Name is required" }),
  cohortSize: z.number().int(),
  coursePassRate: z.number(),
  creditsOnTrackRate: z.number(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  graduationRiskRate: z.number(),
  lastUpdated: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Last Updated is required" }),
  program: z.object({ id: z.string().uuid(), programName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  schoolYear: z.object({ id: z.string().uuid(), schoolYearName: z.string() }),
  statusKey: z.enum(['OnTrack', 'Watch', 'AtRisk', 'Improving']),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  wellbeingCheckinRate: z.number(),
});

/**
 * Schema for creating a new StudentSuccessCohort (omits system-generated ID)
 */
export const CreateStudentSuccessCohortSchema = StudentSuccessCohortSchema.omit({ id: true });

/**
 * Schema for updating an existing StudentSuccessCohort
 */
export const UpdateStudentSuccessCohortSchema = StudentSuccessCohortSchema;

export type StudentSuccessCohortInput = z.infer<typeof StudentSuccessCohortSchema>;
export type CreateStudentSuccessCohortInput = z.infer<typeof CreateStudentSuccessCohortSchema>;
export type UpdateStudentSuccessCohortInput = z.infer<typeof UpdateStudentSuccessCohortSchema>;