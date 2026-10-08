import { redis, USAGE_AGGREGATE_QUEUE } from "@ore/queue";
import { Worker } from "bullmq";
import { processUsage } from "@/processors/usage";

export const usageWorker = new Worker(
  USAGE_AGGREGATE_QUEUE,
  async (job) => {
    return processUsage(job);
  },
  { connection: redis, concurrency: 20 },
);

usageWorker.on("completed", (job) => {
  console.log("usage job completed", { jobId: job.id });
});

usageWorker.on("failed", (job, error) => {
  console.log("Usage job failed", {
    jobId: job?.id,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  });
});

usageWorker.on("error", (error) => {
  console.log("usage worker error", error);
});

const shutdown = async () => {
  await usageWorker.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
