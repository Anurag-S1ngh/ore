import { projectIdParamSchema } from "@/modules/project/project.validation";
import { AppError } from "@/types/error";
import type { Request, Response } from "express";
import { invoicesService } from "./invoices.service";
import {
  createInvoiceSchema,
  invoiceListQuerySchema,
  invoiceParamSchema,
  updateInvoiceSchema,
} from "./invoices.validation";

export const invoicesController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid data",
      });
    }
    const validQuery = invoiceListQuerySchema.safeParse(req.query);
    if (!validQuery.success) {
      return res
        .status(400)
        .json({ error: validQuery.error.issues[0]?.message || "invalid data" });
    }
    const { projectId } = validParam.data;
    try {
      const invoices = await invoicesService.list(projectId, validQuery.data);
      return res.status(200).json({ invoices });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while listing invoices" });
    }
  },

  async get(req: Request, res: Response) {
    const validParam = invoiceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message || "invalid data" });
    }
    const { projectId, invoiceId } = validParam.data;
    try {
      const invoice = await invoicesService.get(projectId, invoiceId);
      return res.status(200).json({ invoice });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching invoice" });
    }
  },

  async create(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({
        error: validParam.error.issues[0]?.message || "invalid data",
      });
    }
    const validatedData = createInvoiceSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message || "invalid data",
      });
    }
    const { projectId } = validParam.data;
    const input = validatedData.data;
    try {
      const invoice = await invoicesService.create(projectId, input);
      return res.status(201).json({ invoice });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating invoice" });
    }
  },

  async update(req: Request, res: Response) {
    const validParam = invoiceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message || "invalid data" });
    }
    const validatedData = updateInvoiceSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res.status(400).json({
        error: validatedData.error.issues[0]?.message || "invalid data",
      });
    }
    const { projectId, invoiceId } = validParam.data;
    const input = validatedData.data;
    try {
      const invoice = await invoicesService.updateStatus(
        projectId,
        invoiceId,
        input,
      );
      return res.status(200).json({ invoice });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while updating invoice" });
    }
  },

  async remove(req: Request, res: Response) {
    const validParam = invoiceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message || "invalid data" });
    }
    const { projectId, invoiceId } = validParam.data;
    try {
      const invoice = await invoicesService.remove(projectId, invoiceId);
      return res.status(200).json({ invoice });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while deleting invoice" });
    }
  },
};
