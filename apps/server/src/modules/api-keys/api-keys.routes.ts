import { Router } from "express";
import { apiKeysController } from "./api-keys.controller";
import { projectOwnedByUser } from "@/middleware/project";
import { userAuthMiddleware } from "@/middleware/auth";

export const apiKeysRouter = Router();

apiKeysRouter.use(userAuthMiddleware);

apiKeysRouter.use(projectOwnedByUser);

apiKeysRouter.get("/:projectId", apiKeysController.list);
apiKeysRouter.post("/:projectId", apiKeysController.create);
apiKeysRouter.delete("/:projectId/:keyId", apiKeysController.revoke);
