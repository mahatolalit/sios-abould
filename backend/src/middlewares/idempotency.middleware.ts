import { Request, Response, NextFunction } from 'express';

// Simple in-memory cache for idempotency
const idempotencyCache = new Map<string, { status: number, body: any }>();

export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'POST') return next();

  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) return next();

  if (idempotencyCache.has(idempotencyKey)) {
    const cachedResponse = idempotencyCache.get(idempotencyKey)!;
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }

  // Intercept the res.json to cache the response
  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(idempotencyKey, { status: res.statusCode, body });
      
      // Setup TTL (e.g., 24 hours). A simplistic implementation. 
      setTimeout(() => {
        idempotencyCache.delete(idempotencyKey);
      }, 24 * 60 * 60 * 1000);
    }
    return originalJson(body);
  };

  next();
};
