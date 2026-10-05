import { Router } from "express";
import { subscriptionsController } from "./subscriptions.controller";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";

export const subscriptionsRouter = Router();

subscriptionsRouter.use(userAuthMiddleware);

subscriptionsRouter.get(
  "/:projectId",
  projectOwnedByUser,
  subscriptionsController.list,
);
subscriptionsRouter.post(
  "/:projectId",
  projectOwnedByUser,
  subscriptionsController.create,
);
subscriptionsRouter.get(
  "/:projectId/:subscriptionId",
  projectOwnedByUser,
  subscriptionsController.get,
);
subscriptionsRouter.patch(
  "/:projectId/:subscriptionId",
  projectOwnedByUser,
  subscriptionsController.update,
);
subscriptionsRouter.delete(
  "/:projectId/:subscriptionId",
  projectOwnedByUser,
  subscriptionsController.cancel,
);
