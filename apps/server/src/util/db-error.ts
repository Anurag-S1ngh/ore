export const isUniqueViolation = (err: unknown) => {
  const code =
    (err as { code?: string })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
};

export const isForeignKeyViolation = (err: unknown) => {
  const code =
    (err as { code?: string })?.code ??
    (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23503";
};
