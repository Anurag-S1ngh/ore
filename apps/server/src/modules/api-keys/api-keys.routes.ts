import { Router } from "express";
import { apiKeysController } from "./api-keys.controller";
import { projectOwnedByUser } from "@/middleware/project";
import { userAuthMiddleware } from "@/middleware/auth";

export const apiKeysRouter = Router();

apiKeysRouter.get(
  "/:projectId",
  userAuthMiddleware,
  projectOwnedByUser,
  apiKeysController.list,
);
apiKeysRouter.post(
  "/:projectId",
  userAuthMiddleware,
  projectOwnedByUser,
  apiKeysController.create,
);
apiKeysRouter.delete(
  "/:projectId/:keyId",
  userAuthMiddleware,
  projectOwnedByUser,
  apiKeysController.revoke,
);
