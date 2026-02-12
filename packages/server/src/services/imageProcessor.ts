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

  // GIF: copy as-is to preserve animation
  if (metadata.format === 'gif') {
    const { copyFile } = await import('fs/promises');
    await copyFile(inputPath, outputPath);
    return getImageMetadata(outputPath);
  }

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

  const metadata = await sharp(inputPath).metadata();

  if (metadata.format === 'gif') {
    // Preserve GIF animation for thumbnails with infinite loop
    await sharp(inputPath, { animated: true })
      .resize(300, 300, { fit: 'cover' })
      .gif({ loop: 0 })
      .toFile(outputPath);
  } else {
    await sharp(inputPath)
      .resize(300, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  }
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
