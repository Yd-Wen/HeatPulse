import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import keywordRoutes from './routes/keywords';
import hotspotRoutes from './routes/hotspots';
import scanRoutes from './routes/scan';
import statsRoutes from './routes/stats';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/keywords', keywordRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/stats', statsRoutes);

// Error handling (Express 5 auto-catches async errors)
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
