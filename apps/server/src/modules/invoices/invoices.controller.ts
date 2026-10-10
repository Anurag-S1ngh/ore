import type { Request, Response } from "express";
import { handleControllerError } from "@/middleware/error";
import { projectIdParamSchema } from "@/modules/project/project.validation";
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
      return res.status(400).json({ error: validQuery.error.issues[0]?.message || "invalid data" });
    }
    const { projectId } = validParam.data;
    try {
      const { invoices, nextCursor } = await invoicesService.list(projectId, validQuery.data);
      return res.status(200).json({ invoices, nextCursor });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "invoices",
        action: "list",
        fallback: "error while listing invoices",
      });
    }
  },

  async get(req: Request, res: Response) {
    const validParam = invoiceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message || "invalid data" });
    }
    const { projectId, invoiceId } = validParam.data;
    try {
      const invoice = await invoicesService.get(projectId, invoiceId);
      return res.status(200).json({ invoice });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "invoices",
        action: "get",
        fallback: "error while fetching invoice",
      });
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
      return handleControllerError(req, res, err, {
        module: "invoices",
        action: "create",
        fallback: "error while creating invoice",
      });
    }
  },

  async update(req: Request, res: Response) {
    const validParam = invoiceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message || "invalid data" });
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
      const invoice = await invoicesService.updateStatus(projectId, invoiceId, input);
      return res.status(200).json({ invoice });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "invoices",
        action: "update",
        fallback: "error while updating invoice",
      });
    }
  },

  async remove(req: Request, res: Response) {
    const validParam = invoiceParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res.status(400).json({ error: validParam.error.issues[0]?.message || "invalid data" });
    }
    const { projectId, invoiceId } = validParam.data;
    try {
      const invoice = await invoicesService.remove(projectId, invoiceId);
      return res.status(200).json({ invoice });
    } catch (err) {
      return handleControllerError(req, res, err, {
        module: "invoices",
        action: "remove",
        fallback: "error while deleting invoice",
      });
    }
  },
};
