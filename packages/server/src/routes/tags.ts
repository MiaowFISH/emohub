import { FastifyPluginAsync } from 'fastify';
import * as tagService from '../services/tagService.js';

const tagRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / - List tags
  fastify.get('/', async (request, reply) => {
    const { search } = request.query as { search?: string };

    try {
      const tags = await tagService.listTags(fastify.prisma, search);
      return reply.send({
        success: true,
        data: tags,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to list tags',
      });
    }
  });

  // POST / - Create tag
  fastify.post('/', async (request, reply) => {
    const { name, category } = request.body as { name: string; category?: string };

    if (!name) {
      return reply.status(400).send({
        success: false,
        error: 'Tag name is required',
      });
    }

    try {
      const tag = await tagService.createTag(fastify.prisma, { name, category });
      return reply.status(201).send({
        success: true,
        data: tag,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create tag',
      });
    }
  });

  // PUT /:id - Rename tag
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { name } = request.body as { name: string };

    if (!name) {
      return reply.status(400).send({
        success: false,
        error: 'Tag name is required',
      });
    }

    try {
      const tag = await tagService.renameTag(fastify.prisma, id, name);
      return reply.send({
        success: true,
        data: tag,
      });
    } catch (error: any) {
      if (error.message === 'Tag not found') {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }
      if (error.message === 'Tag name already exists') {
        return reply.status(409).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to rename tag',
      });
    }
  });

  // DELETE /:id - Delete tag
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const tag = await tagService.deleteTag(fastify.prisma, id);
      return reply.send({
        success: true,
        data: tag,
      });
    } catch (error: any) {
      if (error.message === 'Tag not found') {
        return reply.status(404).send({
          success: false,
          error: error.message,
        });
      }
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to delete tag',
      });
    }
  });

  // POST /batch/add - Batch add tags to images
  fastify.post('/batch/add', async (request, reply) => {
    const { imageIds, tagIds } = request.body as { imageIds: string[]; tagIds: string[] };

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'imageIds array is required',
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'tagIds array is required',
      });
    }

    try {
      await tagService.batchAddTags(fastify.prisma, imageIds, tagIds);
      return reply.send({
        success: true,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to add tags',
      });
    }
  });

  // POST /batch/remove - Batch remove tags from images
  fastify.post('/batch/remove', async (request, reply) => {
    const { imageIds, tagIds } = request.body as { imageIds: string[]; tagIds: string[] };

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'imageIds array is required',
      });
    }

    if (!tagIds || !Array.isArray(tagIds) || tagIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'tagIds array is required',
      });
    }

    try {
      await tagService.batchRemoveTags(fastify.prisma, imageIds, tagIds);
      return reply.send({
        success: true,
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to remove tags',
      });
    }
  });

  // GET /image/:imageId - Get tags for a specific image
  fastify.get('/image/:imageId', async (request, reply) => {
    const { imageId } = request.params as { imageId: string };

    try {
      const tags = await tagService.getImageTags(fastify.prisma, imageId);
      return reply.send({
        success: true,
        data: tags,
      });
    } catch (error: any) {
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to get image tags',
      });
    }
  });
};

export default tagRoutes;
