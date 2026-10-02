import { redis } from "@ore/redis-client";
import { Queue } from "bullmq";

const usageAggreagateQueue = new Queue("usage_aggregate_queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 1000,
      jitter: 0.2,
    },
    removeOnComplete: {
      count: 10_000,
      age: 60 * 60 * 24 * 7,
    },
    removeOnFail: {
      age: 60 * 60 * 24 * 7,
      count: 50_000,
    },
  },
});

export const addUsageAggregateJob = async (eventId: string) => {
  await usageAggreagateQueue.add(
    "usage_aggregate_job",
    { eventId },
    {
      jobId: `usage:${eventId}`,
    },
  );
};
