import Fastify, { FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import dbPlugin from './plugins/db.js';
import storagePlugin from './plugins/storage.js';
import healthRoutes from './routes/health.js';

export async function build(opts: FastifyServerOptions = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
    ...opts,
  });

  await app.register(cors, {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
  });

  await app.register(dbPlugin);
  await app.register(storagePlugin);
  await app.register(healthRoutes, { prefix: '/health' });

  return app;
}
