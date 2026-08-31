import { z } from 'zod';

/**
 * Zod schema for DrillDownRecord validation
 */
export const DrillDownRecordSchema = z.object({
  id: z.string().uuid(),
  drillDownRecordName: z.string().min(1, { message: "Drill Down Record Name is required" }),
  denominator: z.number().int(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  interventionTier: z.object({ id: z.string().uuid(), interventionTierName: z.string() }),
  metricName: z.string().min(1, { message: "Metric Name is required" }),
  metricValue: z.number(),
  numerator: z.number().int(),
  program: z.object({ id: z.string().uuid(), programName: z.string() }),
  recordStatusKey: z.enum(['Green', 'Yellow', 'Red']),
  recordTypeKey: z.enum(['Attendance', 'Literacy', 'Graduation', 'Wellbeing', 'Intervention']),
  reportingPeriod: z.object({ id: z.string().uuid(), reportingPeriodName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  varianceFromTarget: z.number(),
});

/**
 * Schema for creating a new DrillDownRecord (omits system-generated ID)
 */
export const CreateDrillDownRecordSchema = DrillDownRecordSchema.omit({ id: true });

/**
 * Schema for updating an existing DrillDownRecord
 */
export const UpdateDrillDownRecordSchema = DrillDownRecordSchema;

export type DrillDownRecordInput = z.infer<typeof DrillDownRecordSchema>;
export type CreateDrillDownRecordInput = z.infer<typeof CreateDrillDownRecordSchema>;
export type UpdateDrillDownRecordInput = z.infer<typeof UpdateDrillDownRecordSchema>;