import { userAuthMiddleware } from "@/middleware/auth";
import { Router } from "express";
import { projectController } from "./project.controller";

export const projectRouter = Router();

projectRouter.use(userAuthMiddleware);

projectRouter.get("/", projectController.get);
projectRouter.post("/", projectController.create);
projectRouter.patch("/:projectId", projectController.update);
projectRouter.delete("/:projectId", projectController.delete);
