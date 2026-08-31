import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KPISnapshotService } from "../services/kpi-snapshot-service";
import type { KPISnapshot } from "../models/kpi-snapshot-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all KPISnapshot records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, kPISnapshotName, attendanceRate, graduationOnTrackRate, interventionCompletionRate, literacyProficiencyRate, riskLevelKey, wellbeingIndex
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useKPISnapshotList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["kPISnapshot-list", options],
    queryFn: () => KPISnapshotService.getAll(options),
  });
}

/**
 * Retrieve a single KPISnapshot record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useKPISnapshot(id: string) {
  return useQuery({
    queryKey: ["kPISnapshot", id],
    queryFn: () => KPISnapshotService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new KPISnapshot record.
 * @remarks Form validation: use CreateKPISnapshotSchema with zodResolver for type-safe create forms
 */
export function useCreateKPISnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KPISnapshot, "id">) => KPISnapshotService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["kPISnapshot-list"] });
    },
  });
}

/**
 * Update an existing KPISnapshot record.
 * @remarks Form validation: use UpdateKPISnapshotSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateKPISnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<KPISnapshot, "id">>;
    }) => KPISnapshotService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["kPISnapshot-list"] });
      client.invalidateQueries({ queryKey: ["kPISnapshot", variables.id] });
    },
  });
}

/**
 * Delete a KPISnapshot record by its unique identifier.
 */
export function useDeleteKPISnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => KPISnapshotService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["kPISnapshot-list"] });
      client.invalidateQueries({ queryKey: ["kPISnapshot", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const KPISnapshot_DATA_SOURCE_TYPE = 'InMemory' as const;

export { KPISnapshotSchema, CreateKPISnapshotSchema, UpdateKPISnapshotSchema } from "../validators/kpisnapshot-validator";
export type { KPISnapshotInput, CreateKPISnapshotInput, UpdateKPISnapshotInput } from "../validators/kpisnapshot-validator";