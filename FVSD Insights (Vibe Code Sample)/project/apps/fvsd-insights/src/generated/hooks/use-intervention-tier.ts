import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InterventionTierService } from "../services/intervention-tier-service";
import type { InterventionTier } from "../models/intervention-tier-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all InterventionTier records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, interventionTierName, description, intensityKey, tierLevel
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useInterventionTierList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["interventionTier-list", options],
    queryFn: () => InterventionTierService.getAll(options),
  });
}

/**
 * Retrieve a single InterventionTier record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useInterventionTier(id: string) {
  return useQuery({
    queryKey: ["interventionTier", id],
    queryFn: () => InterventionTierService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new InterventionTier record.
 * @remarks Form validation: use CreateInterventionTierSchema with zodResolver for type-safe create forms
 */
export function useCreateInterventionTier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<InterventionTier, "id">) => InterventionTierService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["interventionTier-list"] });
    },
  });
}

/**
 * Update an existing InterventionTier record.
 * @remarks Form validation: use UpdateInterventionTierSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateInterventionTier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<InterventionTier, "id">>;
    }) => InterventionTierService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["interventionTier-list"] });
      client.invalidateQueries({ queryKey: ["interventionTier", variables.id] });
    },
  });
}

/**
 * Delete a InterventionTier record by its unique identifier.
 */
export function useDeleteInterventionTier() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => InterventionTierService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["interventionTier-list"] });
      client.invalidateQueries({ queryKey: ["interventionTier", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const InterventionTier_DATA_SOURCE_TYPE = 'InMemory' as const;

export { InterventionTierSchema, CreateInterventionTierSchema, UpdateInterventionTierSchema } from "../validators/intervention-tier-validator";
export type { InterventionTierInput, CreateInterventionTierInput, UpdateInterventionTierInput } from "../validators/intervention-tier-validator";