export function normalizeKtpForSave(ktp: string | null | undefined): string | null {
  if (ktp === undefined || ktp === null) return null;
  const digits = ktp.replace(/\D/g, "");
  return digits || null;
}

export function buildKtpUpdateData(ktp: string | null | undefined) {
  if (ktp === undefined) return {};
  return { ktp: normalizeKtpForSave(ktp) };
}
