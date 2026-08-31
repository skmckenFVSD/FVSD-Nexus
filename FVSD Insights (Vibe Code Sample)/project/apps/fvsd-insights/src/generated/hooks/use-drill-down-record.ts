import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DrillDownRecordService } from "../services/drill-down-record-service";
import type { DrillDownRecord } from "../models/drill-down-record-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all DrillDownRecord records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, drillDownRecordName, denominator, metricName, metricValue, numerator, recordStatusKey, recordTypeKey, varianceFromTarget
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useDrillDownRecordList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["drillDownRecord-list", options],
    queryFn: () => DrillDownRecordService.getAll(options),
  });
}

/**
 * Retrieve a single DrillDownRecord record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useDrillDownRecord(id: string) {
  return useQuery({
    queryKey: ["drillDownRecord", id],
    queryFn: () => DrillDownRecordService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new DrillDownRecord record.
 * @remarks Form validation: use CreateDrillDownRecordSchema with zodResolver for type-safe create forms
 */
export function useCreateDrillDownRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<DrillDownRecord, "id">) => DrillDownRecordService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["drillDownRecord-list"] });
    },
  });
}

/**
 * Update an existing DrillDownRecord record.
 * @remarks Form validation: use UpdateDrillDownRecordSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateDrillDownRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<DrillDownRecord, "id">>;
    }) => DrillDownRecordService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["drillDownRecord-list"] });
      client.invalidateQueries({ queryKey: ["drillDownRecord", variables.id] });
    },
  });
}

/**
 * Delete a DrillDownRecord record by its unique identifier.
 */
export function useDeleteDrillDownRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DrillDownRecordService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["drillDownRecord-list"] });
      client.invalidateQueries({ queryKey: ["drillDownRecord", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const DrillDownRecord_DATA_SOURCE_TYPE = 'InMemory' as const;

export { DrillDownRecordSchema, CreateDrillDownRecordSchema, UpdateDrillDownRecordSchema } from "../validators/drill-down-record-validator";
export type { DrillDownRecordInput, CreateDrillDownRecordInput, UpdateDrillDownRecordInput } from "../validators/drill-down-record-validator";