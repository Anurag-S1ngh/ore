import { Router } from "express";
import { pricesController } from "./prices.controller";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";

export const pricesRouter = Router();

pricesRouter.use(userAuthMiddleware);

pricesRouter.get(
  "/:projectId/plans/:planId/all",
  projectOwnedByUser,
  pricesController.list,
);
pricesRouter.post(
  "/:projectId/plans/:planId",
  projectOwnedByUser,
  pricesController.create,
);
pricesRouter.get(
  "/:projectId/:priceId",
  projectOwnedByUser,
  pricesController.get,
);
pricesRouter.patch(
  "/:projectId/plans/:planId/:priceId",
  projectOwnedByUser,
  pricesController.update,
);
pricesRouter.delete(
  "/:projectId/:priceId",
  projectOwnedByUser,
  pricesController.delete,
);
