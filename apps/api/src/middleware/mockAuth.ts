import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../types.js';

export function mockAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const headerUserId = req.header('x-user-id');
  req.user = {
    id: headerUserId && headerUserId.trim().length > 0 ? headerUserId : 'demo-user'
  };
  next();
}
