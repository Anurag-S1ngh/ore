ALTER TABLE "invoices" ALTER COLUMN "period_start" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "period_end" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_customer_period_uniq" UNIQUE("project_id","customer_id","period_start","period_end");