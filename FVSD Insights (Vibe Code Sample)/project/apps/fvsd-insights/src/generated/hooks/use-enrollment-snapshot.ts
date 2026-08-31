import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EnrollmentSnapshotService } from "../services/enrollment-snapshot-service";
import type { EnrollmentSnapshot } from "../models/enrollment-snapshot-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all EnrollmentSnapshot records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, enrollmentSnapshotName, enrollmentCount, fTE, percentOfSchool
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useEnrollmentSnapshotList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["enrollmentSnapshot-list", options],
    queryFn: () => EnrollmentSnapshotService.getAll(options),
  });
}

/**
 * Retrieve a single EnrollmentSnapshot record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useEnrollmentSnapshot(id: string) {
  return useQuery({
    queryKey: ["enrollmentSnapshot", id],
    queryFn: () => EnrollmentSnapshotService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new EnrollmentSnapshot record.
 * @remarks Form validation: use CreateEnrollmentSnapshotSchema with zodResolver for type-safe create forms
 */
export function useCreateEnrollmentSnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EnrollmentSnapshot, "id">) => EnrollmentSnapshotService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["enrollmentSnapshot-list"] });
    },
  });
}

/**
 * Update an existing EnrollmentSnapshot record.
 * @remarks Form validation: use UpdateEnrollmentSnapshotSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateEnrollmentSnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<EnrollmentSnapshot, "id">>;
    }) => EnrollmentSnapshotService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["enrollmentSnapshot-list"] });
      client.invalidateQueries({ queryKey: ["enrollmentSnapshot", variables.id] });
    },
  });
}

/**
 * Delete a EnrollmentSnapshot record by its unique identifier.
 */
export function useDeleteEnrollmentSnapshot() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EnrollmentSnapshotService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["enrollmentSnapshot-list"] });
      client.invalidateQueries({ queryKey: ["enrollmentSnapshot", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const EnrollmentSnapshot_DATA_SOURCE_TYPE = 'InMemory' as const;

export { EnrollmentSnapshotSchema, CreateEnrollmentSnapshotSchema, UpdateEnrollmentSnapshotSchema } from "../validators/enrollment-snapshot-validator";
export type { EnrollmentSnapshotInput, CreateEnrollmentSnapshotInput, UpdateEnrollmentSnapshotInput } from "../validators/enrollment-snapshot-validator";