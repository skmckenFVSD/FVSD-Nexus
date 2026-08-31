import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StudentGroupService } from "../services/student-group-service";
import type { StudentGroup } from "../models/student-group-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all StudentGroup records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, studentGroupName, description, groupTypeKey, isPriorityGroup
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useStudentGroupList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["studentGroup-list", options],
    queryFn: () => StudentGroupService.getAll(options),
  });
}

/**
 * Retrieve a single StudentGroup record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useStudentGroup(id: string) {
  return useQuery({
    queryKey: ["studentGroup", id],
    queryFn: () => StudentGroupService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new StudentGroup record.
 * @remarks Form validation: use CreateStudentGroupSchema with zodResolver for type-safe create forms
 */
export function useCreateStudentGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StudentGroup, "id">) => StudentGroupService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["studentGroup-list"] });
    },
  });
}

/**
 * Update an existing StudentGroup record.
 * @remarks Form validation: use UpdateStudentGroupSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateStudentGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<StudentGroup, "id">>;
    }) => StudentGroupService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["studentGroup-list"] });
      client.invalidateQueries({ queryKey: ["studentGroup", variables.id] });
    },
  });
}

/**
 * Delete a StudentGroup record by its unique identifier.
 */
export function useDeleteStudentGroup() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StudentGroupService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["studentGroup-list"] });
      client.invalidateQueries({ queryKey: ["studentGroup", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const StudentGroup_DATA_SOURCE_TYPE = 'InMemory' as const;

export { StudentGroupSchema, CreateStudentGroupSchema, UpdateStudentGroupSchema } from "../validators/student-group-validator";
export type { StudentGroupInput, CreateStudentGroupInput, UpdateStudentGroupInput } from "../validators/student-group-validator";