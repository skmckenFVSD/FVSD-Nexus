import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LiteracyBenchmarkResultService } from "../services/literacy-benchmark-result-service";
import type { LiteracyBenchmarkResult } from "../models/literacy-benchmark-result-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all LiteracyBenchmarkResult records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, literacyBenchmarkResultName, averageScore, benchmarkLevelKey, changeFromPriorPeriod, proficiencyRate, proficientCount, studentsAssessed
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLiteracyBenchmarkResultList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["literacyBenchmarkResult-list", options],
    queryFn: () => LiteracyBenchmarkResultService.getAll(options),
  });
}

/**
 * Retrieve a single LiteracyBenchmarkResult record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLiteracyBenchmarkResult(id: string) {
  return useQuery({
    queryKey: ["literacyBenchmarkResult", id],
    queryFn: () => LiteracyBenchmarkResultService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new LiteracyBenchmarkResult record.
 * @remarks Form validation: use CreateLiteracyBenchmarkResultSchema with zodResolver for type-safe create forms
 */
export function useCreateLiteracyBenchmarkResult() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LiteracyBenchmarkResult, "id">) => LiteracyBenchmarkResultService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["literacyBenchmarkResult-list"] });
    },
  });
}

/**
 * Update an existing LiteracyBenchmarkResult record.
 * @remarks Form validation: use UpdateLiteracyBenchmarkResultSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLiteracyBenchmarkResult() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<LiteracyBenchmarkResult, "id">>;
    }) => LiteracyBenchmarkResultService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["literacyBenchmarkResult-list"] });
      client.invalidateQueries({ queryKey: ["literacyBenchmarkResult", variables.id] });
    },
  });
}

/**
 * Delete a LiteracyBenchmarkResult record by its unique identifier.
 */
export function useDeleteLiteracyBenchmarkResult() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LiteracyBenchmarkResultService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["literacyBenchmarkResult-list"] });
      client.invalidateQueries({ queryKey: ["literacyBenchmarkResult", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const LiteracyBenchmarkResult_DATA_SOURCE_TYPE = 'InMemory' as const;

export { LiteracyBenchmarkResultSchema, CreateLiteracyBenchmarkResultSchema, UpdateLiteracyBenchmarkResultSchema } from "../validators/literacy-benchmark-result-validator";
export type { LiteracyBenchmarkResultInput, CreateLiteracyBenchmarkResultInput, UpdateLiteracyBenchmarkResultInput } from "../validators/literacy-benchmark-result-validator";