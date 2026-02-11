import sharp from 'sharp';
import { mkdir, stat } from 'fs/promises';
import path from 'path';

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

export async function getImageMetadata(inputPath: string): Promise<ImageMetadata> {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const fileStats = await stat(inputPath);

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
    size: fileStats.size,
  };
}

export async function compressImage(
  inputPath: string,
  outputPath: string
): Promise<ImageMetadata> {
  // Create parent directory
  await mkdir(path.dirname(outputPath), { recursive: true });

  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Resize if needed (max 2048x2048)
  let pipeline = image.resize(2048, 2048, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Apply format-specific compression
  switch (metadata.format) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality: 85 });
      break;
    case 'png':
      pipeline = pipeline.png({ compressionLevel: 9 });
      break;
    default:
      // Keep original format
      break;
  }

  await pipeline.toFile(outputPath);

  return getImageMetadata(outputPath);
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string
): Promise<void> {
  // Create parent directory
  await mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(inputPath)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
}

export async function convertToGif(
  inputPath: string,
  outputPath: string
): Promise<string> {
  await sharp(inputPath)
    .resize(300, 300, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .gif()
    .toFile(outputPath);

  return outputPath;
}
