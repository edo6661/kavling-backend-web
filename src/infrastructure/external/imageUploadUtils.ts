import sharp from "sharp";

export async function compressImageForUpload(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize({ width: 800, withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 80 })
    .toBuffer();
}
