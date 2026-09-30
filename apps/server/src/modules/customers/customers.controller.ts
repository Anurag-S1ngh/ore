import { projectIdParamSchema } from "@/modules/project/project.validation";
import { AppError } from "@/types/error";
import type { Request, Response } from "express";
import { customersService } from "./customers.service";
import {
  createCustomerSchema,
  customerParamSchema,
  updateCustomerSchema,
} from "./customers.validation";

export const customersController = {
  async list(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    try {
      const customers = await customersService.list(projectId);
      return res.status(200).json({ customers });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while fetching customers" });
    }
  },

  async create(req: Request, res: Response) {
    const validParam = projectIdParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId } = validParam.data;
    const validatedData = createCustomerSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res
        .status(400)
        .json({ error: validatedData.error.issues[0]?.message });
    }
    const { externalId, name, email, phone } = validatedData.data;
    try {
      const customer = await customersService.create(
        projectId,
        externalId,
        name,
        email,
        phone,
      );
      return res.status(201).json({ customer });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating customer" });
    }
  },

  async update(req: Request, res: Response) {
    const validParam = customerParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message });
    }
    const validatedData = updateCustomerSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res
        .status(400)
        .json({ error: validatedData.error.issues[0]?.message });
    }
    const { projectId, customerId } = validParam.data;
    const { name, email, phone } = validatedData.data;
    try {
      const customer = await customersService.update(
        projectId,
        customerId,
        name,
        email,
        phone,
      );
      return res.status(200).json({ customer });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while updating customer" });
    }
  },

  async delete(req: Request, res: Response) {
    const validParam = customerParamSchema.safeParse(req.params);
    if (!validParam.success) {
      return res
        .status(400)
        .json({ error: validParam.error.issues[0]?.message });
    }
    const { projectId, customerId } = validParam.data;
    try {
      const customer = await customersService.delete(projectId, customerId);
      return res.status(200).json({ customer });
    } catch (err) {
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while deleting customer" });
    }
  },
};
