import pino, { type Logger, type LoggerOptions } from "pino";
import pretty from "pino-pretty";

export type LoggerConfig = {
  name: string;
  level?: string;
  pretty?: boolean;
};

export type { Logger } from "pino";

const REDACT_PATHS = [
  "req.headers.cookie",
  "req.headers.authorization",
  "req.headers['x-api-key']",
  "res.headers['set-cookie']",
];

export const createLogger = ({
  name,
  level = "info",
  pretty: usePretty = false,
}: LoggerConfig): Logger => {
  const options: LoggerOptions = {
    name,
    level,
    redact: { paths: REDACT_PATHS, censor: "[redacted]" },
  };

  if (!usePretty) {
    return pino(options);
  }

  const stream = pretty({
    colorize: true,
    translateTime: "SYS:standard",
    ignore: "pid,hostname",
  });
  return pino(options, stream);
};
