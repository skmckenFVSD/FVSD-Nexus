import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProgramService } from "../services/program-service";
import type { Program } from "../models/program-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Program records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, programName, description, isActive, programTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useProgramList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["program-list", options],
    queryFn: () => ProgramService.getAll(options),
  });
}

/**
 * Retrieve a single Program record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useProgram(id: string) {
  return useQuery({
    queryKey: ["program", id],
    queryFn: () => ProgramService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Program record.
 * @remarks Form validation: use CreateProgramSchema with zodResolver for type-safe create forms
 */
export function useCreateProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Program, "id">) => ProgramService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["program-list"] });
    },
  });
}

/**
 * Update an existing Program record.
 * @remarks Form validation: use UpdateProgramSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Program, "id">>;
    }) => ProgramService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["program-list"] });
      client.invalidateQueries({ queryKey: ["program", variables.id] });
    },
  });
}

/**
 * Delete a Program record by its unique identifier.
 */
export function useDeleteProgram() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProgramService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["program-list"] });
      client.invalidateQueries({ queryKey: ["program", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Program_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ProgramSchema, CreateProgramSchema, UpdateProgramSchema } from "../validators/program-validator";
export type { ProgramInput, CreateProgramInput, UpdateProgramInput } from "../validators/program-validator";