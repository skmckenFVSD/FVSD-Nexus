import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentSuccessCohortService } from "../services/student-success-cohort-service";
import type { StudentSuccessCohort } from "../models/student-success-cohort-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all StudentSuccessCohort records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, studentSuccessCohortName, cohortSize, coursePassRate, creditsOnTrackRate, graduationRiskRate, lastUpdated, statusKey, wellbeingCheckinRate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useStudentSuccessCohortList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["studentSuccessCohort-list", options],
    queryFn: () => StudentSuccessCohortService.getAll(options),
  });
}

/**
 * Retrieve a single StudentSuccessCohort record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useStudentSuccessCohort(id: string) {
  return useQuery({
    queryKey: ["studentSuccessCohort", id],
    queryFn: () => StudentSuccessCohortService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new StudentSuccessCohort record.
 * @remarks Form validation: use CreateStudentSuccessCohortSchema with zodResolver for type-safe create forms
 */
export function useCreateStudentSuccessCohort() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StudentSuccessCohort, "id">) => StudentSuccessCohortService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["studentSuccessCohort-list"] });
    },
  });
}

/**
 * Update an existing StudentSuccessCohort record.
 * @remarks Form validation: use UpdateStudentSuccessCohortSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateStudentSuccessCohort() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<StudentSuccessCohort, "id">>;
    }) => StudentSuccessCohortService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["studentSuccessCohort-list"] });
      client.invalidateQueries({ queryKey: ["studentSuccessCohort", variables.id] });
    },
  });
}

/**
 * Delete a StudentSuccessCohort record by its unique identifier.
 */
export function useDeleteStudentSuccessCohort() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StudentSuccessCohortService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["studentSuccessCohort-list"] });
      client.invalidateQueries({ queryKey: ["studentSuccessCohort", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const StudentSuccessCohort_DATA_SOURCE_TYPE = 'InMemory' as const;

export { StudentSuccessCohortSchema, CreateStudentSuccessCohortSchema, UpdateStudentSuccessCohortSchema } from "../validators/student-success-cohort-validator";
export type { StudentSuccessCohortInput, CreateStudentSuccessCohortInput, UpdateStudentSuccessCohortInput } from "../validators/student-success-cohort-validator";