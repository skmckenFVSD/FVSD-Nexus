import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InterventionPlanService } from "../services/intervention-plan-service";
import type { InterventionPlan } from "../models/intervention-plan-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all InterventionPlan records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, interventionPlanName, focusAreaKey, startDate, statusKey, targetDate, targetMetric
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useInterventionPlanList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["interventionPlan-list", options],
    queryFn: () => InterventionPlanService.getAll(options),
  });
}

/**
 * Retrieve a single InterventionPlan record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useInterventionPlan(id: string) {
  return useQuery({
    queryKey: ["interventionPlan", id],
    queryFn: () => InterventionPlanService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new InterventionPlan record.
 * @remarks Form validation: use CreateInterventionPlanSchema with zodResolver for type-safe create forms
 */
export function useCreateInterventionPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<InterventionPlan, "id">) => InterventionPlanService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["interventionPlan-list"] });
    },
  });
}

/**
 * Update an existing InterventionPlan record.
 * @remarks Form validation: use UpdateInterventionPlanSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateInterventionPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<InterventionPlan, "id">>;
    }) => InterventionPlanService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["interventionPlan-list"] });
      client.invalidateQueries({ queryKey: ["interventionPlan", variables.id] });
    },
  });
}

/**
 * Delete a InterventionPlan record by its unique identifier.
 */
export function useDeleteInterventionPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => InterventionPlanService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["interventionPlan-list"] });
      client.invalidateQueries({ queryKey: ["interventionPlan", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const InterventionPlan_DATA_SOURCE_TYPE = 'InMemory' as const;

export { InterventionPlanSchema, CreateInterventionPlanSchema, UpdateInterventionPlanSchema } from "../validators/intervention-plan-validator";
export type { InterventionPlanInput, CreateInterventionPlanInput, UpdateInterventionPlanInput } from "../validators/intervention-plan-validator";