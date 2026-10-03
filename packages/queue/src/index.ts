import { Queue } from "bullmq";
import Redis from "ioredis";

export interface ProcessUsageJob {
  eventId: string;
}

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const USAGE_AGGREGATE_QUEUE = "usage_aggregate_queue";
export const USAGE_AGGREGATE_JOB = "usage_aggregate_job";

const usageAggregateQueue = new Queue(USAGE_AGGREGATE_QUEUE, {
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
  await usageAggregateQueue.add(
    USAGE_AGGREGATE_JOB,
    { eventId },
    { jobId: `usage-${eventId}` },
  );
};
