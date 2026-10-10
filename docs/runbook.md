# Runbook: billing numbers look wrong

When a customer's invoice looks wrong (missing usage, wrong quantity, wrong amount),
walk these steps in order. Each step points at the table or log line that answers it.

## 1. Did the event reach us?

```sql
SELECT id, project_id, customer_id, metric_id, quantity, timestamp
FROM events
WHERE project_id = '<project>' AND idempotency_key = '<key>';
```

No row → the client never delivered the event (or used a different `idempotencyKey`).

## 2. Was the event processed into an aggregate?

```sql
SELECT *
FROM usage_processed_events
WHERE event_id = '<event id>';
```

- No row → the rollup job never completed. Go to step 3.
- Row present → it was processed; go to step 4.

## 3. Did the rollup job fail?

Grep the worker logs for the event id:

```
# pretty (dev) or JSON (prod), both include the same fields
"msg":"usage job failed" ... "eventId":"<event id>" "jobId":"<job id>"
```

- Worker is `@ore/logger`; every failed job logs one line at `error` level with
  `jobId`, `eventId`, `attemptsMade`, and the serialized `err` (stack included).
- Inspect the BullMQ failed set in Redis for the queue `usage_aggregate_queue`
  (`bull:usage_aggregate_queue:failed`) for jobs that exhausted retries.
- Root causes seen: bad metric aggregation, orphaned event (event row deleted).

## 4. Do the aggregates match the raw events?

```sql
SELECT metric_id, sum(value)
FROM usage_aggregates
WHERE project_id = '<project>' AND customer_id = '<customer>' AND granularity = 'hour'
  AND period_end > '<window start>' AND period_start < '<window end>'
GROUP BY metric_id;
```

Compare against the sum of `events.quantity` for the same metric/window. A mismatch
means a missed or double-processed event (see #6 reconciler / #12 backfill).

## 5. Did the invoice read the usage?

```sql
SELECT metric_id, total_quantity, unit_amount, amount, period_start, period_end
FROM invoice_items
WHERE invoice_id = '<invoice id>';
```

- Quantity 0 for a window that has aggregates → the window/overlap is wrong.
- Quantity present but amount wrong → pricing config (price model / tiers).

## Where the logs come from

- Server request line: `pino-http` (`apps/server/src/index.ts`) — method, url, status, response time.
- Server errors: `handleControllerError` (`apps/server/src/middleware/error.ts`) — one line per
  failed request with `module`, `action`, and `err`.
- Worker job lifecycle: `apps/worker/src/workers/usage/index.ts` (`completed` at debug,
  `failed`/`error` at error) and `apps/worker/src/processors/usage/index.ts`.

Set `LOG_LEVEL` (server and worker `.env`) to `debug` to see per-event/per-job progress.
Cookies, `authorization`, and `x-api-key` headers are redacted in logs.
