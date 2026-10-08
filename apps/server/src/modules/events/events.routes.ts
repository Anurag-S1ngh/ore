import { Router } from "express";
import { userAuthMiddleware } from "@/middleware/auth";
import { projectOwnedByUser } from "@/middleware/project";
import { eventsController } from "./events.controller";

export const eventsRouter = Router();

eventsRouter.post("/", eventsController.create);

eventsRouter.get("/:projectId", userAuthMiddleware, projectOwnedByUser, eventsController.list);
eventsRouter.get(
  "/:projectId/:eventId",
  userAuthMiddleware,
  projectOwnedByUser,
  eventsController.get,
);
