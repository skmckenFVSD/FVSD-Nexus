import { getClient } from '../../../app-gen-sdk/data';
import type { StudentSuccessCohort } from '../models/student-success-cohort-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'StudentSuccessCohort';

export class StudentSuccessCohortService {
  static async create(record: Omit<StudentSuccessCohort, 'id'>): Promise<StudentSuccessCohort> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as StudentSuccessCohort;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<StudentSuccessCohort, 'id'>>
  ): Promise<StudentSuccessCohort> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as StudentSuccessCohort;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<StudentSuccessCohort> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as StudentSuccessCohort;
  }

  static async getAll(options?: IOperationOptions): Promise<StudentSuccessCohort[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as StudentSuccessCohort[];
  }
}