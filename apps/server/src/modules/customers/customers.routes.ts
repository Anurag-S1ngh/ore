import { Router } from "express";
import { customersController } from "./customers.controller";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";

export const customersRouter = Router();

customersRouter.get(
  "/:projectId/",
  userAuthMiddleware,
  projectOwnedByUser,
  customersController.list,
);
customersRouter.post(
  "/:projectId/",
  userAuthMiddleware,
  projectOwnedByUser,
  customersController.create,
);
customersRouter.put(
  "/:projectId/:customerId",
  userAuthMiddleware,
  projectOwnedByUser,
  customersController.update,
);
customersRouter.delete(
  "/:projectId/:customerId",
  userAuthMiddleware,
  projectOwnedByUser,
  customersController.delete,
);
