import { redis, USAGE_AGGREGATE_QUEUE } from "@ore/queue";
import { Worker } from "bullmq";
import { logger } from "@/logger";
import { processUsage } from "@/processors/usage";

export const usageWorker = new Worker(
  USAGE_AGGREGATE_QUEUE,
  async (job) => {
    return processUsage(job);
  },
  { connection: redis, concurrency: 20 },
);

usageWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id, eventId: job.data?.eventId }, "usage job completed");
});

usageWorker.on("failed", (job, error) => {
  logger.error(
    {
      jobId: job?.id,
      eventId: job?.data?.eventId,
      attemptsMade: job?.attemptsMade,
      err: error,
    },
    "usage job failed",
  );
});

usageWorker.on("error", (error) => {
  logger.error({ err: error }, "usage worker error");
});

const shutdown = async () => {
  await usageWorker.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
