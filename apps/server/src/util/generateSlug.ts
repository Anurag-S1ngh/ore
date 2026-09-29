import { randomBytes } from "crypto";

export const generateSlug = (name: string) => {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "project";
  return `${base}-${randomBytes(3).toString("hex")}`;
};
