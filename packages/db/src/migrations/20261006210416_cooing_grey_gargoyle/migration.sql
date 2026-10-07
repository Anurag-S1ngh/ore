ALTER TABLE "invoice_items" ADD COLUMN "subscription_id" uuid;--> statement-breakpoint
UPDATE "invoice_items" "ii" SET "subscription_id" = "i"."subscription_id" FROM "invoices" "i" WHERE "ii"."invoice_id" = "i"."id" AND "ii"."subscription_id" IS NULL;--> statement-breakpoint
ALTER TABLE "invoice_items" ALTER COLUMN "subscription_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_subscription_id_subscriptions_id_fkey";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "subscription_id";--> statement-breakpoint
CREATE INDEX "invoice_items_project_subscription_idx" ON "invoice_items" ("project_id","subscription_id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_subscription_id_subscriptions_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id");
