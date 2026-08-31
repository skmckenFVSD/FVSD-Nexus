import { z } from 'zod';

/**
 * Zod schema for InterventionPlan validation
 */
export const InterventionPlanSchema = z.object({
  id: z.string().uuid(),
  interventionPlanName: z.string().min(1, { message: "Intervention Plan Name is required" }),
  focusAreaKey: z.enum(['Attendance', 'Literacy', 'Numeracy', 'Wellbeing', 'CreditCompletion']),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  interventionTier: z.object({ id: z.string().uuid(), interventionTierName: z.string() }),
  owner: z.object({ id: z.string().uuid(), staffName: z.string() }),
  program: z.object({ id: z.string().uuid(), programName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  schoolYear: z.object({ id: z.string().uuid(), schoolYearName: z.string() }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  statusKey: z.enum(['Planned', 'Active', 'Paused', 'Completed', 'Closed']),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Target Date is required" }),
  targetMetric: z.string().min(1, { message: "Target Metric is required" }),
});

/**
 * Schema for creating a new InterventionPlan (omits system-generated ID)
 */
export const CreateInterventionPlanSchema = InterventionPlanSchema.omit({ id: true });

/**
 * Schema for updating an existing InterventionPlan
 */
export const UpdateInterventionPlanSchema = InterventionPlanSchema;

export type InterventionPlanInput = z.infer<typeof InterventionPlanSchema>;
export type CreateInterventionPlanInput = z.infer<typeof CreateInterventionPlanSchema>;
export type UpdateInterventionPlanInput = z.infer<typeof UpdateInterventionPlanSchema>;