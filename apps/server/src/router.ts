import { Router } from "express";
import { apiKeysRouter } from "./modules/api-keys/api-keys.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { eventsRouter } from "./modules/events/events.routes";
import { invoicesRouter } from "./modules/invoices/invoices.routes";
import { metricsRouter } from "./modules/metrics/metrics.routes";
import { plansRouter } from "./modules/plans/plans.routes";
import { pricesRouter } from "./modules/prices/prices.routes";
import { projectRouter } from "./modules/project/project.routes";
import { subscriptionsRouter } from "./modules/subscriptions/subscriptions.routes";
import { usageRouter } from "./modules/usage/usage.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/projects", projectRouter);
router.use("/api-keys", apiKeysRouter);
router.use("/customers", customersRouter);
router.use("/metrics", metricsRouter);
router.use("/events", eventsRouter);
router.use("/plans", plansRouter);
router.use("/prices", pricesRouter);
router.use("/subscriptions", subscriptionsRouter);
router.use("/usage", usageRouter);
router.use("/invoices", invoicesRouter);
