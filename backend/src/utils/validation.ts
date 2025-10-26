import createHttpError from 'http-errors';
import {ZodError, type ZodSchema} from 'zod';

export function parseWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const detail = error.issues
        .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
        .join(', ');
      throw createHttpError(400, `Validation error: ${detail}`);
    }
    throw createHttpError(400, 'Invalid request payload');
  }
}
