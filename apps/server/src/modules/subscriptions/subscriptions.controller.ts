import type { Request, Response } from "express";
import { projectIdParamSchema } from "@/modules/project/project.validation";
import { AppError } from "@/types/error";
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching subscriptions" });
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching subscription" });
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating subscription" });
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while updating subscription" });
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while canceling subscription" });
    }
  },
};
