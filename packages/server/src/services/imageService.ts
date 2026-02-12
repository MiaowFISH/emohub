import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import { createReadStream, createWriteStream } from 'fs';
import { unlink, stat } from 'fs/promises';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';
import * as imageProcessor from './imageProcessor.js';
import { getImagePath, getThumbnailPath } from '../utils/storage.js';

export async function hashFile(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  const stream = createReadStream(filePath);

  for await (const chunk of stream) {
    hash.update(chunk);
  }

  return hash.digest('hex');
}

interface UploadFileInput {
  filename: string;
  mimetype: string;
  file: NodeJS.ReadableStream;
}

interface UploadResult {
  duplicate: boolean;
  image: any;
}

export async function uploadImage(
  prisma: PrismaClient,
  file: UploadFileInput
): Promise<UploadResult> {
  const tempPath = path.join(os.tmpdir(), `upload-${Date.now()}-${file.filename}`);

  try {
    // Stream file to temp location
    await pipeline(file.file, createWriteStream(tempPath));

    // Compute hash
    const hash = await hashFile(tempPath);

    // Check for duplicate
    const existing = await prisma.image.findUnique({
      where: { hash },
    });

    if (existing) {
      await unlink(tempPath);
      return { duplicate: true, image: existing };
    }

    // Get metadata
    const metadata = await imageProcessor.getImageMetadata(tempPath);

    // Compress to final location
    const finalPath = getImagePath(hash);
    await imageProcessor.compressImage(tempPath, finalPath);

    // Generate thumbnail
    const thumbnailPath = getThumbnailPath(hash);
    await imageProcessor.generateThumbnail(tempPath, thumbnailPath);

    // Create database record
    const image = await prisma.image.create({
      data: {
        filename: hash,
        originalName: file.filename,
        mimeType: file.mimetype,
        size: metadata.size,
        width: metadata.width,
        height: metadata.height,
        hash,
        storagePath: finalPath,
        thumbnailPath,
      },
    });

    // Clean up temp file
    await unlink(tempPath);

    return { duplicate: false, image };
  } catch (error) {
    // Clean up on error
    try {
      await unlink(tempPath);
    } catch {}
    throw error;
  }
}

interface ListImagesResult {
  images: any[];
  total: number;
  page: number;
  limit: number;
}

export async function listImages(
  prisma: PrismaClient,
  page: number = 1,
  limit: number = 50,
  tagIds?: string[],
  search?: string
): Promise<ListImagesResult> {
  const skip = (page - 1) * limit;

  const conditions: any[] = [];

  // Tag filter condition
  if (tagIds && tagIds.length > 0) {
    conditions.push({
      tags: {
        some: {
          tagId: { in: tagIds },
        },
      },
    });
  }

  // Search condition (filename OR tag name)
  if (search && search.trim()) {
    const trimmedSearch = search.trim();
    conditions.push({
      OR: [
        {
          originalName: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          tags: {
            some: {
              tag: {
                name: {
                  contains: trimmedSearch,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      ],
    });
  }

  const where = conditions.length > 0 ? { AND: conditions } : {};

  const [rawImages, total] = await Promise.all([
    prisma.image.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    }),
    prisma.image.count({ where }),
  ]);

  const images = rawImages.map(image => ({
    ...image,
    tags: image.tags.map(it => ({
      id: it.tag.id,
      name: it.tag.name,
      category: it.tag.category,
    })),
  }));

  return { images, total, page, limit };
}

export async function getImage(prisma: PrismaClient, id: string) {
  return prisma.image.findUnique({
    where: { id },
  });
}

export async function deleteImage(prisma: PrismaClient, id: string) {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    return null;
  }

  // Delete files from disk
  try {
    await unlink(image.storagePath);
  } catch (error) {
    console.warn(`Failed to delete image file: ${image.storagePath}`, error);
  }

  if (image.thumbnailPath) {
    try {
      await unlink(image.thumbnailPath);
    } catch (error) {
      console.warn(`Failed to delete thumbnail: ${image.thumbnailPath}`, error);
    }
  }

  // Delete database record
  await prisma.image.delete({
    where: { id },
  });

  return image;
}

export async function convertImageToGif(
  prisma: PrismaClient,
  id: string
): Promise<string> {
  const image = await prisma.image.findUnique({
    where: { id },
  });

  if (!image) {
    throw new Error('Image not found');
  }

  const tempGifPath = path.join(os.tmpdir(), `gif-${Date.now()}-${image.hash}.gif`);
  await imageProcessor.convertToGif(image.storagePath, tempGifPath);

  return tempGifPath;
}
