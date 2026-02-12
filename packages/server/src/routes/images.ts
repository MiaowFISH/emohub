import { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import * as imageService from '../services/imageService.js';

const imageRoutes: FastifyPluginAsync = async (fastify) => {
  // Register multipart plugin
  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // POST /upload - Upload images
  fastify.post('/upload', async (request, reply) => {
    try {
      const files = await request.files();
      const results = [];

      for await (const file of files) {
        const result = await imageService.uploadImage(fastify.prisma, {
          filename: file.filename,
          mimetype: file.mimetype,
          file: file.file,
        });

        results.push({
          ...result.image,
          duplicate: result.duplicate,
        });
      }

      return reply.status(201).send({
        success: true,
        data: results.length === 1 ? results[0] : results,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message || 'Upload failed',
      });
    }
  });

  // GET / - List images with pagination
  fastify.get('/', async (request, reply) => {
    const { page = 1, limit = 50, tagIds, search } = request.query as any;

    const tagIdsArray = tagIds
      ? (typeof tagIds === 'string' ? tagIds.split(',') : tagIds)
      : undefined;

    const searchQuery = typeof search === 'string' ? search : undefined;

    const result = await imageService.listImages(
      fastify.prisma,
      Number(page),
      Number(limit),
      tagIdsArray,
      searchQuery
    );

    return reply.send({
      success: true,
      data: result.images,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
      },
    });
  });

  // GET /:id/thumbnail - Serve thumbnail
  fastify.get('/:id/thumbnail', async (request, reply) => {
    const { id } = request.params as { id: string };
    const image = await imageService.getImage(fastify.prisma, id);

    if (!image) {
      return reply.status(404).send({
        success: false,
        error: 'Image not found',
      });
    }

    const thumbnailPath = image.thumbnailPath || image.storagePath;
    return reply.type('image/jpeg').send(createReadStream(thumbnailPath));
  });

  // GET /:id/full - Serve full image
  fastify.get('/:id/full', async (request, reply) => {
    const { id } = request.params as { id: string };
    const image = await imageService.getImage(fastify.prisma, id);

    if (!image) {
      return reply.status(404).send({
        success: false,
        error: 'Image not found',
      });
    }

    return reply.type(image.mimeType).send(createReadStream(image.storagePath));
  });

  // DELETE /:id - Delete single image
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const image = await imageService.deleteImage(fastify.prisma, id);

    if (!image) {
      return reply.status(404).send({
        success: false,
        error: 'Image not found',
      });
    }

    return reply.send({
      success: true,
      data: image,
    });
  });

  // DELETE /batch - Delete multiple images
  fastify.delete('/batch', async (request, reply) => {
    const { ids } = request.body as { ids: string[] };
    const results = [];

    for (const id of ids) {
      const image = await imageService.deleteImage(fastify.prisma, id);
      results.push({ id, deleted: !!image });
    }

    return reply.send({
      success: true,
      data: results,
    });
  });

  // POST /:id/convert-gif - Convert image to GIF
  fastify.post('/:id/convert-gif', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const gifPath = await imageService.convertImageToGif(fastify.prisma, id);

      reply.type('image/gif');
      reply.header('Content-Disposition', 'attachment; filename="image.gif"');

      const stream = createReadStream(gifPath);

      // Clean up temp file after streaming
      stream.on('end', async () => {
        try {
          await unlink(gifPath);
        } catch (error) {
          fastify.log.warn(`Failed to clean up temp GIF: ${gifPath}`);
        }
      });

      return reply.send(stream);
    } catch (error: any) {
      return reply.status(404).send({
        success: false,
        error: error.message || 'Image not found',
      });
    }
  });
};

export default imageRoutes;
