ALTER TABLE "plans" DROP CONSTRAINT "plans_project_id_external_plan_id_unique";--> statement-breakpoint
ALTER TABLE "prices" DROP CONSTRAINT "prices_project_id_external_price_id_unique";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_project_id_external_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "plans" DROP COLUMN "external_plan_id";--> statement-breakpoint
ALTER TABLE "prices" DROP COLUMN "external_price_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "external_subscription_id";