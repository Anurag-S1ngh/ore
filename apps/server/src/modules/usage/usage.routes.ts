import { Router } from "express";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { usageController } from "./usage.controller";

export const usageRouter = Router();

usageRouter.use(userAuthMiddleware);

usageRouter.get("/:projectId", projectOwnedByUser, usageController.list);
usageRouter.get("/:projectId/:usageId", projectOwnedByUser, usageController.get);
