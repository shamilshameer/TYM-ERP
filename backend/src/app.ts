import express from 'express';
import cors from 'cors';
import { loggerMiddleware } from './middlewares/logger';
import { errorHandler } from './middlewares/errorHandler';
import syncRoutes from './routes/syncRoutes';
import { getHealth } from './controllers/syncController';

const app = express();

// Middleware
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: allowedOrigin === '*' ? true : [allowedOrigin, 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Support larger sync payloads if needed
app.use(loggerMiddleware);

// Routes
app.get('/health', getHealth);
app.use('/sync', syncRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
