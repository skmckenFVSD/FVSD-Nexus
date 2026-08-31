import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SchoolYearService } from "../services/school-year-service";
import type { SchoolYear } from "../models/school-year-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all SchoolYear records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, schoolYearName, endDate, isCurrent, startDate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSchoolYearList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["schoolYear-list", options],
    queryFn: () => SchoolYearService.getAll(options),
  });
}

/**
 * Retrieve a single SchoolYear record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSchoolYear(id: string) {
  return useQuery({
    queryKey: ["schoolYear", id],
    queryFn: () => SchoolYearService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new SchoolYear record.
 * @remarks Form validation: use CreateSchoolYearSchema with zodResolver for type-safe create forms
 */
export function useCreateSchoolYear() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SchoolYear, "id">) => SchoolYearService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["schoolYear-list"] });
    },
  });
}

/**
 * Update an existing SchoolYear record.
 * @remarks Form validation: use UpdateSchoolYearSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSchoolYear() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<SchoolYear, "id">>;
    }) => SchoolYearService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["schoolYear-list"] });
      client.invalidateQueries({ queryKey: ["schoolYear", variables.id] });
    },
  });
}

/**
 * Delete a SchoolYear record by its unique identifier.
 */
export function useDeleteSchoolYear() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SchoolYearService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["schoolYear-list"] });
      client.invalidateQueries({ queryKey: ["schoolYear", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const SchoolYear_DATA_SOURCE_TYPE = 'InMemory' as const;

export { SchoolYearSchema, CreateSchoolYearSchema, UpdateSchoolYearSchema } from "../validators/school-year-validator";
export type { SchoolYearInput, CreateSchoolYearInput, UpdateSchoolYearInput } from "../validators/school-year-validator";