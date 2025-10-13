import express, {
  json,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler
} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { registerRoutes } from './routes/index.js';
import { authMiddleware } from './middleware/auth.js';
import { 
  errorHandlerMiddleware, 
  requestContextMiddleware, 
  setupGracefulShutdown 
} from './middleware/error-handler.js';
import { HttpError } from './utils/http.js';
import { logger } from './utils/logger.js';

const app = express();

// Security and logging middleware
app.use(helmet());
app.use(
  cors({
    origin: '*'
  })
);
app.use(json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Request context and authentication
app.use(requestContextMiddleware);
app.use(authMiddleware as unknown as RequestHandler);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

registerRoutes(app);

// Comprehensive error handling middleware
app.use(errorHandlerMiddleware);

const server = app.listen(env.port, () => {
  logger.info(`🚀 API running on http://localhost:${env.port}`, {
    additionalData: { 
      nodeEnv: env.nodeEnv,
      port: env.port 
    }
  });
});

// Setup graceful shutdown
setupGracefulShutdown(server);
