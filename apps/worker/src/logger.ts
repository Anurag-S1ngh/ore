import { createLogger } from "@ore/logger";

import { ENV } from "./env.server";

export const logger = createLogger({
  name: "worker",
  level: ENV.LOG_LEVEL,
  pretty: ENV.NODE_ENV !== "production",
});
