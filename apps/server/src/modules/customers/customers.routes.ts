import { Router } from "express";
import { customersController } from "./customers.controller";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";

export const customersRouter = Router();

customersRouter.use(userAuthMiddleware);

customersRouter.use(projectOwnedByUser);

customersRouter.get("/:projectId/", customersController.list);
customersRouter.post("/:projectId/", customersController.create);
customersRouter.put("/:projectId/:customerId", customersController.update);
customersRouter.delete("/:projectId/:customerId", customersController.delete);
