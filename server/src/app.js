import express from 'express';
import cors from 'cors';
import cuentaRoutes from './routes/cuenta.routes.js';
import { manejadorErrores, rutaNoEncontrada } from './middleware/errorHandler.js';

export function crearApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', (_req, res) => res.json({ estado: 'ok' }));
  app.use('/api/cuenta', cuentaRoutes);

  app.use(rutaNoEncontrada);
  app.use(manejadorErrores);
  return app;
}
