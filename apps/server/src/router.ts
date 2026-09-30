import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { projectRouter } from "./modules/project/project.routes";
import { apiKeysRouter } from "./modules/api-keys/api-keys.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { metricsRouter } from "./modules/metrics/metrics.routes";

export const router = Router();

router.use("/auth", authRouter);
router.use("/projects", projectRouter);
router.use("/api-keys", apiKeysRouter);
router.use("/customers", customersRouter);
router.use("/metrics", metricsRouter);
