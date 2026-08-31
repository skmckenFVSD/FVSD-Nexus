import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceTrendService } from "../services/attendance-trend-service";
import type { AttendanceTrend } from "../models/attendance-trend-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AttendanceTrend records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, attendanceTrendName, attendanceRate, changeFromPriorPeriod, chronicAbsenteeismRate, daysInSession, excusedAbsences, trendDirectionKey, unexcusedAbsences
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAttendanceTrendList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["attendanceTrend-list", options],
    queryFn: () => AttendanceTrendService.getAll(options),
  });
}

/**
 * Retrieve a single AttendanceTrend record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAttendanceTrend(id: string) {
  return useQuery({
    queryKey: ["attendanceTrend", id],
    queryFn: () => AttendanceTrendService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AttendanceTrend record.
 * @remarks Form validation: use CreateAttendanceTrendSchema with zodResolver for type-safe create forms
 */
export function useCreateAttendanceTrend() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AttendanceTrend, "id">) => AttendanceTrendService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["attendanceTrend-list"] });
    },
  });
}

/**
 * Update an existing AttendanceTrend record.
 * @remarks Form validation: use UpdateAttendanceTrendSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAttendanceTrend() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AttendanceTrend, "id">>;
    }) => AttendanceTrendService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["attendanceTrend-list"] });
      client.invalidateQueries({ queryKey: ["attendanceTrend", variables.id] });
    },
  });
}

/**
 * Delete a AttendanceTrend record by its unique identifier.
 */
export function useDeleteAttendanceTrend() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AttendanceTrendService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["attendanceTrend-list"] });
      client.invalidateQueries({ queryKey: ["attendanceTrend", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AttendanceTrend_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AttendanceTrendSchema, CreateAttendanceTrendSchema, UpdateAttendanceTrendSchema } from "../validators/attendance-trend-validator";
export type { AttendanceTrendInput, CreateAttendanceTrendInput, UpdateAttendanceTrendInput } from "../validators/attendance-trend-validator";