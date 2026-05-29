/** Batas ukuran file sesuai plan Cloudinary (Console → Settings → Usage Limits). */
export const CLOUDINARY_MAX_RAW_FILE_BYTES = 10 * 1024 * 1024;
export const CLOUDINARY_MAX_RAW_FILE_MB =
  CLOUDINARY_MAX_RAW_FILE_BYTES / (1024 * 1024);

export const CLOUDINARY_MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;
export const CLOUDINARY_MAX_IMAGE_FILE_MB =
  CLOUDINARY_MAX_IMAGE_FILE_BYTES / (1024 * 1024);
