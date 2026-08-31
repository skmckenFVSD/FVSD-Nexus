import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssistantInsightService } from "../services/assistant-insight-service";
import type { AssistantInsight } from "../models/assistant-insight-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AssistantInsight records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, assistantInsightName, confidenceRate, createdDate, insightTypeKey, recommendedAction, severityKey, summary
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAssistantInsightList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["assistantInsight-list", options],
    queryFn: () => AssistantInsightService.getAll(options),
  });
}

/**
 * Retrieve a single AssistantInsight record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAssistantInsight(id: string) {
  return useQuery({
    queryKey: ["assistantInsight", id],
    queryFn: () => AssistantInsightService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AssistantInsight record.
 * @remarks Form validation: use CreateAssistantInsightSchema with zodResolver for type-safe create forms
 */
export function useCreateAssistantInsight() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AssistantInsight, "id">) => AssistantInsightService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["assistantInsight-list"] });
    },
  });
}

/**
 * Update an existing AssistantInsight record.
 * @remarks Form validation: use UpdateAssistantInsightSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAssistantInsight() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AssistantInsight, "id">>;
    }) => AssistantInsightService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["assistantInsight-list"] });
      client.invalidateQueries({ queryKey: ["assistantInsight", variables.id] });
    },
  });
}

/**
 * Delete a AssistantInsight record by its unique identifier.
 */
export function useDeleteAssistantInsight() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssistantInsightService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["assistantInsight-list"] });
      client.invalidateQueries({ queryKey: ["assistantInsight", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AssistantInsight_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AssistantInsightSchema, CreateAssistantInsightSchema, UpdateAssistantInsightSchema } from "../validators/assistant-insight-validator";
export type { AssistantInsightInput, CreateAssistantInsightInput, UpdateAssistantInsightInput } from "../validators/assistant-insight-validator";