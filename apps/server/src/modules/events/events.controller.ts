import { AppError } from "@/types/error";
import type { Request, Response } from "express";
import { eventsService } from "./events.service";
import { eventsValidationSchema } from "./events.validation";

export const eventsController = {
  async create(req: Request, res: Response) {
    const validatedData = eventsValidationSchema.safeParse(req.body);
    if (!validatedData.success) {
      return res
        .status(400)
        .json({ error: validatedData.error.issues[0]?.message });
    }
    const {
      metricName,
      apiKey,
      externalCustomerId,
      idempotencyKey,
      quantity,
      timestamp,
    } = validatedData.data;
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
      console.log(err);
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      return res.status(500).json({ error: "error while creating event" });
    }
  },
};
