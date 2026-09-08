export interface MediaUpload {
  url: string;
  key: string;
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
