export const isUniqueViolation = (err: unknown) => {
  const code =
    (err as { code?: string })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
};

export const isForeignKeyViolation = (err: unknown) => {
  const code =
    (err as { code?: string })?.code ?? (err as { cause?: { code?: string } })?.cause?.code;
  return code === "23503";
};

export const isPeriodConflict = (err: unknown) => {
  const constraint =
    (err as { constraint?: string })?.constraint ??
    (err as { cause?: { constraint?: string } })?.cause?.constraint;
  return constraint === "invoices_project_customer_period_uniq";
};
