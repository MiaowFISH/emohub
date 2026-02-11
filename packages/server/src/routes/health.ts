import { FastifyPluginAsync } from 'fastify';
import { access } from 'fs/promises';
import { getStorageBasePath } from '../utils/storage.js';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (request, reply) => {
    try {
      // Check database connection
      await fastify.prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'connected';

      // Check storage directory
      const storagePath = getStorageBasePath();
      await access(storagePath);
      const storageStatus = 'ready';

      return reply.code(200).send({
        status: 'ok',
        uptime: process.uptime(),
        database: dbStatus,
        storage: storageStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      fastify.log.error({ error }, 'Health check failed');
      return reply.code(503).send({
        status: 'degraded',
        uptime: process.uptime(),
        database: 'error',
        storage: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default healthRoutes;
