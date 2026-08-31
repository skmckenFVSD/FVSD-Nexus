import { getClient } from '../../../app-gen-sdk/data';
import type { StudentGroup } from '../models/student-group-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'StudentGroup';

export class StudentGroupService {
  static async create(record: Omit<StudentGroup, 'id'>): Promise<StudentGroup> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as StudentGroup;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<StudentGroup, 'id'>>
  ): Promise<StudentGroup> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as StudentGroup;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<StudentGroup> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as StudentGroup;
  }

  static async getAll(options?: IOperationOptions): Promise<StudentGroup[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as StudentGroup[];
  }
}