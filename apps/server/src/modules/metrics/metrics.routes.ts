import { Router } from "express";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { metricsController } from "./metrics.controller";

export const metricsRouter = Router();

metricsRouter.get("/:projectId/", userAuthMiddleware, projectOwnedByUser, metricsController.list);
metricsRouter.post(
  "/:projectId/",
  userAuthMiddleware,
  projectOwnedByUser,
  metricsController.create,
);
metricsRouter.delete(
  "/:projectId/:metricId",
  userAuthMiddleware,
  projectOwnedByUser,
  metricsController.delete,
);
