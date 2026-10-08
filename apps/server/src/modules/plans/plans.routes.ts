import { Router } from "express";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { plansController } from "./plans.controller";

export const plansRouter = Router();

plansRouter.use(userAuthMiddleware);

plansRouter.get("/:projectId", projectOwnedByUser, plansController.list);
plansRouter.post("/:projectId", projectOwnedByUser, plansController.create);
plansRouter.patch("/:projectId/:planId", projectOwnedByUser, plansController.update);
plansRouter.delete("/:projectId/:planId", projectOwnedByUser, plansController.delete);
