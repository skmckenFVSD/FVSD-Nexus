import { z } from 'zod';

/**
 * Zod schema for LiteracyBenchmarkResult validation
 */
export const LiteracyBenchmarkResultSchema = z.object({
  id: z.string().uuid(),
  literacyBenchmarkResultName: z.string().min(1, { message: "Literacy Benchmark Result Name is required" }),
  averageScore: z.number(),
  benchmarkLevelKey: z.enum(['Emerging', 'Developing', 'Proficient', 'Extending']),
  changeFromPriorPeriod: z.number(),
  gradeBand: z.object({ id: z.string().uuid(), gradeBandName: z.string() }),
  proficiencyRate: z.number(),
  proficientCount: z.number().int(),
  program: z.object({ id: z.string().uuid(), programName: z.string() }),
  reportingPeriod: z.object({ id: z.string().uuid(), reportingPeriodName: z.string() }),
  school: z.object({ id: z.string().uuid(), schoolName: z.string() }),
  studentGroup: z.object({ id: z.string().uuid(), studentGroupName: z.string() }),
  studentsAssessed: z.number().int(),
});

/**
 * Schema for creating a new LiteracyBenchmarkResult (omits system-generated ID)
 */
export const CreateLiteracyBenchmarkResultSchema = LiteracyBenchmarkResultSchema.omit({ id: true });

/**
 * Schema for updating an existing LiteracyBenchmarkResult
 */
export const UpdateLiteracyBenchmarkResultSchema = LiteracyBenchmarkResultSchema;

export type LiteracyBenchmarkResultInput = z.infer<typeof LiteracyBenchmarkResultSchema>;
export type CreateLiteracyBenchmarkResultInput = z.infer<typeof CreateLiteracyBenchmarkResultSchema>;
export type UpdateLiteracyBenchmarkResultInput = z.infer<typeof UpdateLiteracyBenchmarkResultSchema>;