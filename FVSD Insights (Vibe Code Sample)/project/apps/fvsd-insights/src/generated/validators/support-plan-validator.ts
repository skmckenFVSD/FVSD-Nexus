import { z } from 'zod';

/**
 * Zod schema for SupportPlan validation
 */
export const SupportPlanSchema = z.object({
  id: z.string().uuid(),
  supportPlanName: z.string().min(1, { message: "Support Plan Name is required" }),
  averageDaysToSupport: z.number(),
  coordinator: z.object({ id: z.string().uuid(), staffName: z.string() }),
  effectivenessRating: z.number(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  interventionTier: z.object({ id: z.string().uuid(), interventionTierName: z.string() }),
  referralsCompleted: z.number().int(),
  reportingPeriod: z.object({ id: z.string().uuid(), reportingPeriodName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  statusKey: z.enum(['Planned', 'Active', 'Paused', 'Completed', 'Closed']),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  studentsSupported: z.number().int(),
  supportTypeKey: z.enum(['Counselling', 'LearningSupport', 'AttendanceOutreach', 'FamilyLiaison', 'BehaviourSupport']),
});

/**
 * Schema for creating a new SupportPlan (omits system-generated ID)
 */
export const CreateSupportPlanSchema = SupportPlanSchema.omit({ id: true });

/**
 * Schema for updating an existing SupportPlan
 */
export const UpdateSupportPlanSchema = SupportPlanSchema;

export type SupportPlanInput = z.infer<typeof SupportPlanSchema>;
export type CreateSupportPlanInput = z.infer<typeof CreateSupportPlanSchema>;
export type UpdateSupportPlanInput = z.infer<typeof UpdateSupportPlanSchema>;