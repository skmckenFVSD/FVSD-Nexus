import { z } from 'zod';

/**
 * Zod schema for InterventionTier validation
 */
export const InterventionTierSchema = z.object({
  id: z.string().uuid(),
  interventionTierName: z.string().min(1, { message: "Intervention Tier Name is required" }),
  description: z.string().optional(),
  intensityKey: z.enum(['Universal', 'Targeted', 'Intensive']),
  tierLevel: z.number().int(),
});

/**
 * Schema for creating a new InterventionTier (omits system-generated ID)
 */
export const CreateInterventionTierSchema = InterventionTierSchema.omit({ id: true });

/**
 * Schema for updating an existing InterventionTier
 */
export const UpdateInterventionTierSchema = InterventionTierSchema;

export type InterventionTierInput = z.infer<typeof InterventionTierSchema>;
export type CreateInterventionTierInput = z.infer<typeof CreateInterventionTierSchema>;
export type UpdateInterventionTierInput = z.infer<typeof UpdateInterventionTierSchema>;