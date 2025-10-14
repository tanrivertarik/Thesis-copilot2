import type { NextFunction, Response } from 'express';
import admin from 'firebase-admin';
import type { AuthedRequest } from '../types.js';
import { env } from '../config/env.js';

type JwtHeader = {
  alg?: string;
};

type JwtPayload = {
  uid?: string;
  sub?: string;
  user_id?: string;
  email?: string;
};

function ensureFirebaseApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  if (!env.firebaseAdmin) {
    throw new Error('Firebase Admin credentials missing. Cannot verify ID tokens.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebaseAdmin.projectId,
      clientEmail: env.firebaseAdmin.clientEmail,
      privateKey: env.firebaseAdmin.privateKey
    })
  });
}

function decodeJwtSegment(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded = normalized + (padding ? '='.repeat(4 - padding) : '');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function isEmulatorToken(token: string): boolean {
  const [headerSegment] = token.split('.');
  if (!headerSegment) {
    return false;
  }

  try {
    const header = JSON.parse(decodeJwtSegment(headerSegment)) as JwtHeader;
    return header.alg === 'none';
  } catch {
    return false;
  }
}

function extractEmulatorUser(token: string): { id: string; email?: string } {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid token format');
  }

  const payload = JSON.parse(decodeJwtSegment(parts[1])) as JwtPayload;
  const uid = payload.user_id ?? payload.sub ?? payload.uid;

  if (!uid) {
    throw new Error('Emulator token missing user identifier');
  }

  return {
    id: uid,
    email: payload.email ?? undefined
  };
}

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const match = authHeader.match(/^Bearer (.*)$/i);
    if (!match) {
      return res.status(401).json({ message: 'Authorization header must use Bearer token' });
    }

    const token = match[1];
    if (!token) {
      return res.status(401).json({ message: 'Empty Bearer token' });
    }

    if (env.nodeEnv !== 'production' && isEmulatorToken(token)) {
      req.user = extractEmulatorUser(token);
      return next();
    }

    ensureFirebaseApp();

    const decoded = await admin.auth().verifyIdToken(token, true);
    req.user = {
      id: decoded.uid,
      email: decoded.email ?? undefined
    };

    next();
  } catch (error) {
    console.error('[authMiddleware] verification failed', error);
    res.status(401).json({ message: 'Invalid or expired auth token' });
  }
}
