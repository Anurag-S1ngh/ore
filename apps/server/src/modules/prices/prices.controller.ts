import type { Request, Response } from "express";
import { AppError } from "@/types/error";
import { pricesService } from "./prices.service";
import {
  createPriceSchema,
  priceListParamSchema,
  priceParamSchema,
  priceUpdateParamSchema,
  updatePriceSchema,
} from "./prices.validation";

export const pricesController = {
  async list(req: Request, res: Response) {
    const validParam = priceListParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid input",
      });
    }
    const { projectId, planId } = validParam.data;
    try {
      const prices = await pricesService.list(projectId, planId);
      return res.status(200).json({ prices });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching prices" });
    }
  },

  async get(req: Request, res: Response) {
    const validParam = priceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, priceId } = validParam.data;
    try {
      const price = await pricesService.get(projectId, priceId);
      return res.status(200).json({ price });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching price" });
    }
  },

  async create(req: Request, res: Response) {
    const validParam = priceListParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = createPriceSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message ?? "invalid input",
      });
    }
    const { projectId, planId } = validParam.data;
    const input = validatedData.data;
    try {
      const price = await pricesService.create(projectId, planId, input);
      return res.status(201).json({ price });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating price" });
    }
  },

  async update(req: Request, res: Response) {
    const validParam = priceUpdateParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = updatePriceSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message ?? "invalid input",
      });
    }
    const { projectId, planId, priceId } = validParam.data;
    const input = validatedData.data;
    try {
      const price = await pricesService.update(projectId, planId, priceId, input);
      return res.status(200).json({ price });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while updating price" });
    }
  },

  async delete(req: Request, res: Response) {
    const validParam = priceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid input",
      });
    }
    const { projectId, priceId } = validParam.data;
    try {
      const price = await pricesService.delete(projectId, priceId);
      return res.status(200).json({ price });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while deleting price" });
    }
  },
};
