CREATE TABLE "usage_processed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" text NOT NULL,
	"processed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_processed_events" ADD CONSTRAINT "usage_processed_events_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id");