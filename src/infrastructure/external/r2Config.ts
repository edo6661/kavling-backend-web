import { env } from "../../config/env.js";

export const isR2Configured = (): boolean =>
  Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME &&
      env.R2_PUBLIC_BASE_URL,
  );

export const getR2Endpoint = (): string =>
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
