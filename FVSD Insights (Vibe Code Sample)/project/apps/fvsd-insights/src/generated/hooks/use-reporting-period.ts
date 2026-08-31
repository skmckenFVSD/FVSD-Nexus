import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReportingPeriodService } from "../services/reporting-period-service";
import type { ReportingPeriod } from "../models/reporting-period-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ReportingPeriod records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, reportingPeriodName, endDate, periodTypeKey, sequenceNumber, startDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useReportingPeriodList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["reportingPeriod-list", options],
    queryFn: () => ReportingPeriodService.getAll(options),
  });
}

/**
 * Retrieve a single ReportingPeriod record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useReportingPeriod(id: string) {
  return useQuery({
    queryKey: ["reportingPeriod", id],
    queryFn: () => ReportingPeriodService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ReportingPeriod record.
 * @remarks Form validation: use CreateReportingPeriodSchema with zodResolver for type-safe create forms
 */
export function useCreateReportingPeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ReportingPeriod, "id">) => ReportingPeriodService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["reportingPeriod-list"] });
    },
  });
}

/**
 * Update an existing ReportingPeriod record.
 * @remarks Form validation: use UpdateReportingPeriodSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateReportingPeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ReportingPeriod, "id">>;
    }) => ReportingPeriodService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["reportingPeriod-list"] });
      client.invalidateQueries({ queryKey: ["reportingPeriod", variables.id] });
    },
  });
}

/**
 * Delete a ReportingPeriod record by its unique identifier.
 */
export function useDeleteReportingPeriod() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ReportingPeriodService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["reportingPeriod-list"] });
      client.invalidateQueries({ queryKey: ["reportingPeriod", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ReportingPeriod_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ReportingPeriodSchema, CreateReportingPeriodSchema, UpdateReportingPeriodSchema } from "../validators/reporting-period-validator";
export type { ReportingPeriodInput, CreateReportingPeriodInput, UpdateReportingPeriodInput } from "../validators/reporting-period-validator";