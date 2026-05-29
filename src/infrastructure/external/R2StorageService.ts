import { randomUUID } from "node:crypto";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "../../config/env.js";
import { getR2Endpoint } from "./r2Config.js";

export function extractR2ObjectKey(url: string): string | null {
  const base = env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  const prefix = `${base}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return key.length > 0 ? key : null;
}

export function isR2StorageUrl(url: string): boolean {
  return extractR2ObjectKey(url) !== null;
}

export class R2StorageService {
  private readonly client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: "auto",
      endpoint: getR2Endpoint(),
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }

  async upload(
    buffer: Buffer,
    folder: string,
    options: { contentType: string; extension: string },
  ): Promise<string> {
    const key = `${folder.replace(/\/$/, "")}/${randomUUID()}${options.extension}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
      }),
    );

    const base = env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "");
    return `${base}/${key}`;
  }

  async deleteByUrl(url: string): Promise<void> {
    const key = extractR2ObjectKey(url);
    if (!key) return;

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME!,
        Key: key,
      }),
    );
    console.log(`Berhasil menghapus file dari R2: ${key}`);
  }
}
