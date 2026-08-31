import { z } from 'zod';

/**
 * Zod schema for KPISnapshot validation
 */
export const KPISnapshotSchema = z.object({
  id: z.string().uuid(),
  kPISnapshotName: z.string().min(1, { message: "KPI Snapshot Name is required" }),
  attendanceRate: z.number(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  graduationOnTrackRate: z.number(),
  interventionCompletionRate: z.number(),
  literacyProficiencyRate: z.number(),
  program: z.object({ id: z.string().uuid(), programName: z.string() }),
  reportingPeriod: z.object({ id: z.string().uuid(), reportingPeriodName: z.string() }),
  riskLevelKey: z.enum(['Low', 'Moderate', 'Elevated', 'Critical']),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  wellbeingIndex: z.number(),
});

/**
 * Schema for creating a new KPISnapshot (omits system-generated ID)
 */
export const CreateKPISnapshotSchema = KPISnapshotSchema.omit({ id: true });

/**
 * Schema for updating an existing KPISnapshot
 */
export const UpdateKPISnapshotSchema = KPISnapshotSchema;

export type KPISnapshotInput = z.infer<typeof KPISnapshotSchema>;
export type CreateKPISnapshotInput = z.infer<typeof CreateKPISnapshotSchema>;
export type UpdateKPISnapshotInput = z.infer<typeof UpdateKPISnapshotSchema>;