export const resolveCustomerNik = (noIdentitas?: string | null): string => {
  const trimmed = noIdentitas?.trim();
  if (trimmed) return trimmed;
  return `DUMMY-${Date.now().toString().slice(-10)}`;
};

export const formatCustomerNikForDisplay = (nikKtp: string): string =>
  nikKtp.startsWith("DUMMY-") ? "" : nikKtp;
