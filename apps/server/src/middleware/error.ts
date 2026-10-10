import type { Request, Response } from "express";

import { logger } from "@/logger";
import { AppError } from "@/types/error";

type ErrorContext = {
  module: string;
  action: string;
  fallback: string;
};

export const handleControllerError = (
  req: Request,
  res: Response,
  err: unknown,
  ctx: ErrorContext,
) => {
  const log = req.log ?? logger;

  if (err instanceof AppError) {
    log.warn(
      { err, module: ctx.module, action: ctx.action, statusCode: err.statusCode },
      err.message,
    );
    return res.status(err.statusCode).json({ error: err.message });
  }

  log.error({ err, module: ctx.module, action: ctx.action }, ctx.fallback);
  return res.status(500).json({ error: ctx.fallback });
};
