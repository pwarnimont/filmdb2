import createHttpError from 'http-errors';
import {ZodError, type ZodTypeAny, type infer as ZodInfer} from 'zod';

export function parseWithSchema<S extends ZodTypeAny>(schema: S, data: unknown): ZodInfer<S> {
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
