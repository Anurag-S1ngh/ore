import type { Request, Response } from "express";
import { handleControllerError } from "@/middleware/error";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { subscriptionsService } from "./subscriptions.service";
import {
  createSubscriptionSchema,
  subscriptionListQuerySchema,
  subscriptionParamSchema,
  updateSubscriptionSchema,
} from "./subscriptions.validation";

export const subscriptionsController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid input",
      });
    }
    const validQuery = subscriptionListQuerySchema.safeParse(req.query);
    if (!validQuery.success) {
      return res.status(400).json({
        error: validQuery.error.issues[0]?.message || "invalid input",
      });
    }
    const { projectId } = validParam.data;
    const input = validQuery.data;
    try {
      const subscriptions = await subscriptionsService.list(projectId, input);
      return res.status(200).json({ subscriptions });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "subscriptions",
        action: "list",
        fallback: "error while fetching subscriptions",
      });
    }
  },

  async get(req: Request, res: Response) {
    const validParam = subscriptionParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, subscriptionId } = validParam.data;
    try {
      const subscription = await subscriptionsService.get(projectId, subscriptionId);
      return res.status(200).json({ subscription });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "subscriptions",
        action: "get",
        fallback: "error while fetching subscription",
      });
    }
  },

  async create(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid input",
      });
    }
    const validatedData = createSubscriptionSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message || "invalid input",
      });
    }
    const { projectId } = validParam.data;
    const input = validatedData.data;
    try {
      const subscription = await subscriptionsService.create(projectId, input);
      return res.status(201).json({ subscription });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "subscriptions",
        action: "create",
        fallback: "error while creating subscription",
      });
    }
  },

  async update(req: Request, res: Response) {
    const validParam = subscriptionParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = updateSubscriptionSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message ?? "invalid input",
      });
    }
    const { projectId, subscriptionId } = validParam.data;
    const input = validatedData.data;
    try {
      const subscription = await subscriptionsService.update(projectId, subscriptionId, input);
      return res.status(200).json({ subscription });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "subscriptions",
        action: "update",
        fallback: "error while updating subscription",
      });
    }
  },

  async cancel(req: Request, res: Response) {
    const validParam = subscriptionParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, subscriptionId } = validParam.data;
    try {
      const subscription = await subscriptionsService.cancel(projectId, subscriptionId);
      return res.status(200).json({ subscription });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "subscriptions",
        action: "cancel",
        fallback: "error while canceling subscription",
      });
    }
  },
};
