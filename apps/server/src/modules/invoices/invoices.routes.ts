import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { Router } from "express";
import { invoicesController } from "./invoices.controller";

export const invoicesRouter = Router();

invoicesRouter.use(userAuthMiddleware);

invoicesRouter.get("/:projectId", projectOwnedByUser, invoicesController.list);
invoicesRouter.post(
  "/:projectId",
  projectOwnedByUser,
  invoicesController.create,
);
invoicesRouter.get(
  "/:projectId/:invoiceId",
  projectOwnedByUser,
  invoicesController.get,
);
invoicesRouter.patch(
  "/:projectId/:invoiceId",
  projectOwnedByUser,
  invoicesController.update,
);
invoicesRouter.delete(
  "/:projectId/:invoiceId",
  projectOwnedByUser,
  invoicesController.remove,
);
