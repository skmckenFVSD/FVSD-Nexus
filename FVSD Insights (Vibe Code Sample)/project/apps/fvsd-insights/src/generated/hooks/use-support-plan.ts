import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SupportPlanService } from "../services/support-plan-service";
import type { SupportPlan } from "../models/support-plan-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all SupportPlan records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, supportPlanName, averageDaysToSupport, effectivenessRating, referralsCompleted, statusKey, studentsSupported, supportTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSupportPlanList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["supportPlan-list", options],
    queryFn: () => SupportPlanService.getAll(options),
  });
}

/**
 * Retrieve a single SupportPlan record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSupportPlan(id: string) {
  return useQuery({
    queryKey: ["supportPlan", id],
    queryFn: () => SupportPlanService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new SupportPlan record.
 * @remarks Form validation: use CreateSupportPlanSchema with zodResolver for type-safe create forms
 */
export function useCreateSupportPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SupportPlan, "id">) => SupportPlanService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["supportPlan-list"] });
    },
  });
}

/**
 * Update an existing SupportPlan record.
 * @remarks Form validation: use UpdateSupportPlanSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSupportPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<SupportPlan, "id">>;
    }) => SupportPlanService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["supportPlan-list"] });
      client.invalidateQueries({ queryKey: ["supportPlan", variables.id] });
    },
  });
}

/**
 * Delete a SupportPlan record by its unique identifier.
 */
export function useDeleteSupportPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SupportPlanService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["supportPlan-list"] });
      client.invalidateQueries({ queryKey: ["supportPlan", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const SupportPlan_DATA_SOURCE_TYPE = 'InMemory' as const;

export { SupportPlanSchema, CreateSupportPlanSchema, UpdateSupportPlanSchema } from "../validators/support-plan-validator";
export type { SupportPlanInput, CreateSupportPlanInput, UpdateSupportPlanInput } from "../validators/support-plan-validator";