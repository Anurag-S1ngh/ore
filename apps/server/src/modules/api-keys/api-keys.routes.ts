import { Router } from "express";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { apiKeysController } from "./api-keys.controller";

export const apiKeysRouter = Router();

apiKeysRouter.get("/:projectId", userAuthMiddleware, projectOwnedByUser, apiKeysController.list);
apiKeysRouter.post("/:projectId", userAuthMiddleware, projectOwnedByUser, apiKeysController.create);
apiKeysRouter.delete(
  "/:projectId/:keyId",
  userAuthMiddleware,
  projectOwnedByUser,
  apiKeysController.revoke,
);
