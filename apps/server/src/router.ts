import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { projectRouter } from "./modules/project/project.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/projects", projectRouter);
