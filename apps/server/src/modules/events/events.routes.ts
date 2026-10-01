import { Router } from "express";
import { eventsController } from "./events.controller";

export const eventsRouter = Router();

eventsRouter.post("/", eventsController.create);
