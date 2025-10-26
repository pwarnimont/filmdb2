/* eslint-disable @typescript-eslint/no-unused-vars */
import type {NextFunction, Request, Response} from 'express';
import createHttpError from 'http-errors';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(createHttpError(404, 'Not Found'));
}

export function errorHandler(
  err: createHttpError.HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? err.status ?? 500;
  const message = err.message ?? 'Internal Server Error';

  res.status(status).json({
    error: {
      message,
      status
    }
  });
}
