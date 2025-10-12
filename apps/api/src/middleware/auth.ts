import type { NextFunction, Response } from 'express';
import admin from 'firebase-admin';
import type { AuthedRequest } from '../types.js';
import { env } from '../config/env.js';

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

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    ensureFirebaseApp();

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

    const decoded = await admin.auth().verifyIdToken(token, true);
    req.user = {
      id: decoded.uid,
      email: decoded.email
    };

    next();
  } catch (error) {
    console.error('[authMiddleware] verification failed', error);
    res.status(401).json({ message: 'Invalid or expired auth token' });
  }
}
