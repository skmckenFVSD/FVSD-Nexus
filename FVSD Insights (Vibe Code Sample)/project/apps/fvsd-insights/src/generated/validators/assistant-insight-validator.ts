import { z } from 'zod';

/**
 * Zod schema for AssistantInsight validation
 */
export const AssistantInsightSchema = z.object({
  id: z.string().uuid(),
  assistantInsightName: z.string().min(1, { message: "Assistant Insight Name is required" }),
  confidenceRate: z.number(),
  createdBy: z.object({ id: z.string().uuid(), staffName: z.string() }),
  createdDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created Date is required" }),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  insightTypeKey: z.enum(['Trend', 'EquityGap', 'Forecast', 'Anomaly', 'Recommendation']),
  recommendedAction: z.string().min(1, { message: "Recommended Action is required" }),
  reportingPeriod: z.object({ id: z.string().uuid(), reportingPeriodName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  severityKey: z.enum(['Low', 'Moderate', 'High', 'Urgent']),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  summary: z.string().min(1, { message: "Summary is required" }),
});

/**
 * Schema for creating a new AssistantInsight (omits system-generated ID)
 */
export const CreateAssistantInsightSchema = AssistantInsightSchema.omit({ id: true });

/**
 * Schema for updating an existing AssistantInsight
 */
export const UpdateAssistantInsightSchema = AssistantInsightSchema;

export type AssistantInsightInput = z.infer<typeof AssistantInsightSchema>;
export type CreateAssistantInsightInput = z.infer<typeof CreateAssistantInsightSchema>;
export type UpdateAssistantInsightInput = z.infer<typeof UpdateAssistantInsightSchema>;