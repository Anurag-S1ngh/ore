import { randomBytes } from "crypto";

export const generateInvoiceNumber = (issuedAt: Date): string => {
  const stamp = issuedAt.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = randomBytes(4).toString("hex").toUpperCase();
  return `INV-${stamp}-${suffix}`;
};
