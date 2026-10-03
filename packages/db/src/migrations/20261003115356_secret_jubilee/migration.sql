ALTER TABLE "usage_processed_events" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "usage_processed_events" ALTER COLUMN "event_id" SET DATA TYPE uuid USING "event_id"::uuid;--> statement-breakpoint
ALTER TABLE "usage_processed_events" ADD CONSTRAINT "usage_processed_events_event_id_key" UNIQUE("event_id");