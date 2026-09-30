import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { Router } from "express";
import { metricsController } from "./metrics.controller";

export const metricsRouter = Router();

metricsRouter.use(userAuthMiddleware);

metricsRouter.use(projectOwnedByUser);

metricsRouter.get("/:projectId/", metricsController.list);
metricsRouter.post("/:projectId/", metricsController.create);
metricsRouter.delete("/:projectId/:metricId", metricsController.delete);
