import type { NextFunction, Request, Response } from "express";
import { logger } from "@/logger";
import { verifyJWT } from "@/util/token";

export const userAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authCookie = req.cookies.auth_cookie;
  if (!authCookie) {
    return res.status(401).json({ error: "unauthorized" });
  }
  try {
    const decoded = await verifyJWT(authCookie);
    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: "unauthorized" });
    }
    req.userId = userId;
    next();
  } catch (err) {
    (req.log ?? logger).warn({ err }, "auth verification failed");
    return res.status(401).json({ error: "unauthorized" });
  }
};
