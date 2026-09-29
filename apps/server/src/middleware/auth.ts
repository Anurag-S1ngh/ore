import { verifyJWT } from "@/util/token";
import type { NextFunction, Request, Response } from "express";

export const userAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authCookie = req.cookies["auth_cookie"];
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
    console.log(err);
    return res.status(401).json({ error: "unauthorized" });
  }
};
