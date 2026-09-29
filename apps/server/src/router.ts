import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";

export const router = Router();

router.use("/auth", authRouter);
