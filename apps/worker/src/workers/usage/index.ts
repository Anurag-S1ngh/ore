import { processUsage } from "@/processors/usage";
import { redis } from "@ore/redis-client";
import { Worker } from "bullmq";

export const usageWorker = new Worker(
  "usage_aggregate_queue",
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
