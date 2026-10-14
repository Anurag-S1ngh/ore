import { users } from "@ore/db/schema/index";
import { eq } from "drizzle-orm";
import type { NextFunction, Request, Response } from "express";

import { logger } from "@/logger";
import { handleControllerError } from "@/middleware/error";
import { db } from "@/services";
import { verifyJWT } from "@/util/token";

export const userAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const log = req.log ?? logger;
  const authCookie = req.cookies.auth_cookie;
  if (!authCookie) {
    return res.status(401).json({ error: "unauthorized" });
  }

  let userId: string | undefined;
  try {
    const decoded = await verifyJWT(authCookie);
    userId = decoded.sub;
  } catch (err) {
    log.warn({ err }, "auth verification failed");
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!userId) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      log.warn({ userId }, "session user no longer exists");
      res.clearCookie("auth_cookie", { path: "/" });
      return res.status(401).json({ error: "session expired, please log in again" });
    }
  } catch (err) {
    return handleControllerError(req, res, err, {
      module: "auth",
      action: "verifySession",
      fallback: "error while verifying session",
    });
  }

  req.userId = userId;
  next();
};
