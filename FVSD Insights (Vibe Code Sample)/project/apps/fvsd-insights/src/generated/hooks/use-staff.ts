import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StaffService } from "../services/staff-service";
import type { Staff } from "../models/staff-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Staff records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, staffName, email, isActive, phone, roleKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useStaffList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["staff-list", options],
    queryFn: () => StaffService.getAll(options),
  });
}

/**
 * Retrieve a single Staff record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useStaff(id: string) {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: () => StaffService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Staff record.
 * @remarks Form validation: use CreateStaffSchema with zodResolver for type-safe create forms
 */
export function useCreateStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Staff, "id">) => StaffService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["staff-list"] });
    },
  });
}

/**
 * Update an existing Staff record.
 * @remarks Form validation: use UpdateStaffSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Staff, "id">>;
    }) => StaffService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["staff-list"] });
      client.invalidateQueries({ queryKey: ["staff", variables.id] });
    },
  });
}

/**
 * Delete a Staff record by its unique identifier.
 */
export function useDeleteStaff() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StaffService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["staff-list"] });
      client.invalidateQueries({ queryKey: ["staff", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Staff_DATA_SOURCE_TYPE = 'InMemory' as const;

export { StaffSchema, CreateStaffSchema, UpdateStaffSchema } from "../validators/staff-validator";
export type { StaffInput, CreateStaffInput, UpdateStaffInput } from "../validators/staff-validator";