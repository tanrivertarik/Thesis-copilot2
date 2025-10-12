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
import { HttpError } from './utils/http.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: '*'
  })
);
app.use(json({ limit: '1mb' }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(authMiddleware as unknown as RequestHandler);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime()
  });
});

registerRoutes(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);

  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.port, () => {
  console.log(`🚀 API running on http://localhost:${env.port}`);
});
