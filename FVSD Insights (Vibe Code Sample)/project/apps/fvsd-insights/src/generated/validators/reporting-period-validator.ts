import { z } from 'zod';

/**
 * Zod schema for ReportingPeriod validation
 */
export const ReportingPeriodSchema = z.object({
  id: z.string().uuid(),
  reportingPeriodName: z.string().min(1, { message: "Reporting Period Name is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "End Date is required" }),
  periodTypeKey: z.enum(['Month', 'Term', 'Semester', 'YearToDate']),
  schoolYear: z.object({ id: z.string().uuid(), schoolYearName: z.string() }),
  sequenceNumber: z.number().int(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  statusKey: z.enum(['Open', 'Closed', 'Published']),
});

/**
 * Schema for creating a new ReportingPeriod (omits system-generated ID)
 */
export const CreateReportingPeriodSchema = ReportingPeriodSchema.omit({ id: true });

/**
 * Schema for updating an existing ReportingPeriod
 */
export const UpdateReportingPeriodSchema = ReportingPeriodSchema;

export type ReportingPeriodInput = z.infer<typeof ReportingPeriodSchema>;
export type CreateReportingPeriodInput = z.infer<typeof CreateReportingPeriodSchema>;
export type UpdateReportingPeriodInput = z.infer<typeof UpdateReportingPeriodSchema>;