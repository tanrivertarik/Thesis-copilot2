import type { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler<
  Req extends Request = Request,
  Res extends Response = Response
>(
  handler: (req: Req, res: Res, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return ((req: Req, res: Res, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  }) as unknown as RequestHandler;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}
