import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SchoolService } from "../services/school-service";
import type { School } from "../models/school-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all School records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, schoolName, capacity, isActive, municipality, province, regionKey, schoolNumber, schoolTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSchoolList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["school-list", options],
    queryFn: () => SchoolService.getAll(options),
  });
}

/**
 * Retrieve a single School record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSchool(id: string) {
  return useQuery({
    queryKey: ["school", id],
    queryFn: () => SchoolService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new School record.
 * @remarks Form validation: use CreateSchoolSchema with zodResolver for type-safe create forms
 */
export function useCreateSchool() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<School, "id">) => SchoolService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["school-list"] });
    },
  });
}

/**
 * Update an existing School record.
 * @remarks Form validation: use UpdateSchoolSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSchool() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<School, "id">>;
    }) => SchoolService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["school-list"] });
      client.invalidateQueries({ queryKey: ["school", variables.id] });
    },
  });
}

/**
 * Delete a School record by its unique identifier.
 */
export function useDeleteSchool() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SchoolService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["school-list"] });
      client.invalidateQueries({ queryKey: ["school", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const School_DATA_SOURCE_TYPE = 'InMemory' as const;

export { SchoolSchema, CreateSchoolSchema, UpdateSchoolSchema } from "../validators/school-validator";
export type { SchoolInput, CreateSchoolInput, UpdateSchoolInput } from "../validators/school-validator";