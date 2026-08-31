import { z } from 'zod';

/**
 * Zod schema for AttendanceTrend validation
 */
export const AttendanceTrendSchema = z.object({
  id: z.string().uuid(),
  attendanceTrendName: z.string().min(1, { message: "Attendance Trend Name is required" }),
  attendanceRate: z.number(),
  changeFromPriorPeriod: z.number(),
  chronicAbsenteeismRate: z.number(),
  daysInSession: z.number().int(),
  excusedAbsences: z.number().int(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  reportingPeriod: z.object({ id: z.string().uuid(), reportingPeriodName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  trendDirectionKey: z.enum(['Improving', 'Stable', 'Declining']),
  unexcusedAbsences: z.number().int(),
});

/**
 * Schema for creating a new AttendanceTrend (omits system-generated ID)
 */
export const CreateAttendanceTrendSchema = AttendanceTrendSchema.omit({ id: true });

/**
 * Schema for updating an existing AttendanceTrend
 */
export const UpdateAttendanceTrendSchema = AttendanceTrendSchema;

export type AttendanceTrendInput = z.infer<typeof AttendanceTrendSchema>;
export type CreateAttendanceTrendInput = z.infer<typeof CreateAttendanceTrendSchema>;
export type UpdateAttendanceTrendInput = z.infer<typeof UpdateAttendanceTrendSchema>;