import { PrismaClient } from '@prisma/client';

interface CreateTagInput {
  name: string;
  category?: string;
}

export async function createTag(
  prisma: PrismaClient,
  input: CreateTagInput
) {
  const normalizedName = input.name.trim().toLowerCase();

  if (!normalizedName) {
    throw new Error('Tag name cannot be empty');
  }

  const tag = await prisma.tag.upsert({
    where: { name: normalizedName },
    update: {},
    create: {
      name: normalizedName,
      category: input.category || 'keyword',
    },
  });

  return tag;
}

export async function listTags(
  prisma: PrismaClient,
  search?: string
) {
  const where = search
    ? {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }
    : {};

  const tags = await prisma.tag.findMany({
    where,
    include: {
      _count: {
        select: { images: true },
      },
    },
    orderBy: { name: 'asc' },
    take: 100,
  });

  return tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    category: tag.category,
    createdAt: tag.createdAt,
    imageCount: tag._count.images,
  }));
}

export async function renameTag(
  prisma: PrismaClient,
  id: string,
  newName: string
) {
  const normalizedName = newName.trim().toLowerCase();

  if (!normalizedName) {
    throw new Error('Tag name cannot be empty');
  }

  const existing = await prisma.tag.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Tag not found');
  }

  const conflict = await prisma.tag.findFirst({
    where: {
      name: normalizedName,
      id: { not: id },
    },
  });

  if (conflict) {
    throw new Error('Tag name already exists');
  }

  const updated = await prisma.tag.update({
    where: { id },
    data: { name: normalizedName },
  });

  return updated;
}

export async function deleteTag(
  prisma: PrismaClient,
  id: string
) {
  const tag = await prisma.tag.findUnique({
    where: { id },
  });

  if (!tag) {
    throw new Error('Tag not found');
  }

  const deleted = await prisma.tag.delete({
    where: { id },
  });

  return deleted;
}

export async function getImageTags(
  prisma: PrismaClient,
  imageId: string
) {
  const imageTags = await prisma.imageTag.findMany({
    where: { imageId },
    include: { tag: true },
  });

  return imageTags.map(it => it.tag);
}

export async function batchAddTags(
  prisma: PrismaClient,
  imageIds: string[],
  tagIds: string[]
) {
  const combinations = imageIds.flatMap(imageId =>
    tagIds.map(tagId => ({ imageId, tagId }))
  );

  // SQLite doesn't support skipDuplicates, so we use upsert for each combination
  await prisma.$transaction(
    combinations.map(({ imageId, tagId }) =>
      prisma.imageTag.upsert({
        where: {
          imageId_tagId: { imageId, tagId },
        },
        update: {},
        create: { imageId, tagId },
      })
    )
  );
}

export async function batchRemoveTags(
  prisma: PrismaClient,
  imageIds: string[],
  tagIds: string[]
) {
  await prisma.imageTag.deleteMany({
    where: {
      imageId: { in: imageIds },
      tagId: { in: tagIds },
    },
  });
}
