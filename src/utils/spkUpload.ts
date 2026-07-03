import type { Request } from "express";

export const getSpkUploadBuffers = (req: Request) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const fileSpkBuffer =
    files?.fileSpk?.[0]?.buffer ??
    (req.file?.fieldname === "fileSpk" ? req.file.buffer : undefined);
  const fileRabBuffer = files?.fileRab?.[0]?.buffer;
  return { fileSpkBuffer, fileRabBuffer };
};
