export interface Image {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  hash: string;
  storagePath: string;
  thumbnailPath: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateImageInput {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  hash: string;
  storagePath: string;
  thumbnailPath?: string;
}

export interface ImageWithTags extends Image {
  tags: Array<{ id: string; name: string; category: string | null }>;
}

export interface ImageUploadResult extends Image {
  duplicate: boolean;
}
