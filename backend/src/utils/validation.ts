import createHttpError from 'http-errors';
import type {ZodType} from 'zod';

export function parseWithSchema<T>(schema: ZodType<T, any, unknown>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      const issues = (error as {issues: Array<{path: Array<string | number>; message: string}>}).issues;
      const detail = issues.map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`).join(', ');
      throw createHttpError(400, `Validation error: ${detail}`);
    }
    throw createHttpError(400, 'Invalid request payload');
  }
}
