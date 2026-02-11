import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { mkdir } from 'fs/promises';
import path from 'path';
import { getStorageBasePath } from '../utils/storage.js';

const storagePlugin: FastifyPluginAsync = async (fastify) => {
  const basePath = getStorageBasePath();
  const imagesPath = path.join(basePath, 'images');
  const thumbnailsPath = path.join(basePath, 'thumbnails');

  await mkdir(imagesPath, { recursive: true });
  await mkdir(thumbnailsPath, { recursive: true });

  fastify.log.info(`Storage directories initialized at ${basePath}`);
};

export default fp(storagePlugin);
