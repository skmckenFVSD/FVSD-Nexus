import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GradeBandService } from "../services/grade-band-service";
import type { GradeBand } from "../models/grade-band-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all GradeBand records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, gradeBandName, maximumGrade, minimumGrade, sortOrder
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useGradeBandList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["gradeBand-list", options],
    queryFn: () => GradeBandService.getAll(options),
  });
}

/**
 * Retrieve a single GradeBand record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useGradeBand(id: string) {
  return useQuery({
    queryKey: ["gradeBand", id],
    queryFn: () => GradeBandService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new GradeBand record.
 * @remarks Form validation: use CreateGradeBandSchema with zodResolver for type-safe create forms
 */
export function useCreateGradeBand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GradeBand, "id">) => GradeBandService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["gradeBand-list"] });
    },
  });
}

/**
 * Update an existing GradeBand record.
 * @remarks Form validation: use UpdateGradeBandSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateGradeBand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<GradeBand, "id">>;
    }) => GradeBandService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["gradeBand-list"] });
      client.invalidateQueries({ queryKey: ["gradeBand", variables.id] });
    },
  });
}

/**
 * Delete a GradeBand record by its unique identifier.
 */
export function useDeleteGradeBand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => GradeBandService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["gradeBand-list"] });
      client.invalidateQueries({ queryKey: ["gradeBand", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const GradeBand_DATA_SOURCE_TYPE = 'InMemory' as const;

export { GradeBandSchema, CreateGradeBandSchema, UpdateGradeBandSchema } from "../validators/grade-band-validator";
export type { GradeBandInput, CreateGradeBandInput, UpdateGradeBandInput } from "../validators/grade-band-validator";