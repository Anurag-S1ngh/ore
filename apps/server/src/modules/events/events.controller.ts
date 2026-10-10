import type { Request, Response } from "express";
import { handleControllerError } from "@/middleware/error";
import { projectIdParamSchema } from "../project/project.validation";
import { eventsService } from "./events.service";
import {
  eventListQuerySchema,
  eventParamSchema,
  eventsValidationSchema,
} from "./events.validation";

export const eventsController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validQuery = eventListQuerySchema.safeParse(req.query);
    if (!validQuery.success) {
      return res.status(400).json({ error: validQuery.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    try {
      const { events, nextCursor } = await eventsService.list(projectId, validQuery.data);
      return res.status(200).json({ events, nextCursor });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "events",
        action: "list",
        fallback: "error while listing events",
      });
    }
  },
  async get(req: Request, res: Response) {
    const validParam = eventParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, eventId } = validParam.data;
    try {
      const event = await eventsService.get(projectId, eventId);
      return res.status(200).json({ event });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "events",
        action: "get",
        fallback: "error while fetching event",
      });
    }
  },
  async create(req: Request, res: Response) {
    const validatedData = eventsValidationSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.issues[0]?.message });
    }
    const { metricName, apiKey, externalCustomerId, idempotencyKey, quantity, timestamp } =
      validatedData.data;
    try {
      const { event, duplicate } = await eventsService.create(
        metricName,
        apiKey,
        externalCustomerId,
        idempotencyKey,
        quantity,
        timestamp,
      );
      return res.status(duplicate ? 200 : 201).json({ event });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "events",
        action: "create",
        fallback: "error while creating event",
      });
    }
  },
};
