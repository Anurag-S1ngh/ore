CREATE TYPE "cadence_enum" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "currency_enum" AS ENUM('USD', 'JPY', 'INR');--> statement-breakpoint
CREATE TYPE "granularity_enum" AS ENUM('hour', 'day', 'week', 'month');--> statement-breakpoint
CREATE TYPE "invoice_status_enum" AS ENUM('draft', 'pending', 'paid');--> statement-breakpoint
CREATE TYPE "line_item_type_enum" AS ENUM('fixed', 'usage');--> statement-breakpoint
CREATE TYPE "aggregation_enum" AS ENUM('sum', 'max', 'count');--> statement-breakpoint
CREATE TYPE "price_model_type_enum" AS ENUM('unit', 'tiered');--> statement-breakpoint
CREATE TYPE "subscription_status_enum" AS ENUM('active', 'upcoming', 'canceled');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL UNIQUE,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"external_id" text NOT NULL,
	"name" text,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_project_id_external_id_unique" UNIQUE("project_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"metric_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"quantity" numeric(20,6) NOT NULL,
	"timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_project_id_idempotency_key_unique" UNIQUE("project_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"invoice_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"price_id" uuid,
	"metric_id" uuid,
	"type" "line_item_type_enum" NOT NULL,
	"total_quantity" numeric(20,6) NOT NULL,
	"unit_amount" numeric(20,6) NOT NULL,
	"amount" numeric(20,6) NOT NULL,
	"currency" "currency_enum" NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "invoice_status_enum" NOT NULL,
	"invoice_number" text NOT NULL,
	"currency" "currency_enum" NOT NULL,
	"total_amount" numeric(20,6) NOT NULL,
	"period_start" timestamp with time zone,
	"period_end" timestamp with time zone,
	"issued_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"due_date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_project_id_invoice_number_unique" UNIQUE("project_id","invoice_number")
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text NOT NULL,
	"aggregation" "aggregation_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "metrics_project_id_name_unique" UNIQUE("project_id","name")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"external_plan_id" text NOT NULL,
	"parent_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_project_id_external_plan_id_unique" UNIQUE("project_id","external_plan_id")
);
--> statement-breakpoint
CREATE TABLE "price_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"price_id" uuid NOT NULL,
	"first_unit" numeric(20,6) NOT NULL,
	"last_unit" numeric(20,6),
	"unit_amount" numeric(20,6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "price_tiers_price_id_first_unit_unique" UNIQUE("price_id","first_unit")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"metric_id" uuid,
	"unit_amount" numeric(20,6),
	"currency" "currency_enum" NOT NULL,
	"model_type" "price_model_type_enum" NOT NULL,
	"cadence" "cadence_enum" NOT NULL,
	"external_price_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "prices_project_id_external_price_id_unique" UNIQUE("project_id","external_price_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"default_currency" "currency_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_price_intervals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subscription_id" uuid NOT NULL,
	"price_id" uuid NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"status" "subscription_status_enum" NOT NULL,
	"external_subscription_id" text NOT NULL,
	"cadence" "cadence_enum" NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"canceled_at" timestamp with time zone,
	CONSTRAINT "subscriptions_project_id_external_subscription_id_unique" UNIQUE("project_id","external_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "usage_aggregates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"project_id" uuid NOT NULL,
	"metric_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"value" numeric(20,6) NOT NULL,
	"granularity" "granularity_enum" NOT NULL,
	"aggregation" "aggregation_enum" NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "usage_aggregates_project_id_customer_id_metric_id_granularity_period_start_unique" UNIQUE("project_id","customer_id","metric_id","granularity","period_start")
);
--> statement-breakpoint
CREATE TABLE "usage_processed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"event_id" uuid NOT NULL UNIQUE,
	"processed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"username" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "api_keys_project_idx" ON "api_keys" ("project_id");--> statement-breakpoint
CREATE INDEX "customers_project_email_idx" ON "customers" ("project_id","email");--> statement-breakpoint
CREATE INDEX "events_project_customer_ts_idx" ON "events" ("project_id","customer_id","timestamp");--> statement-breakpoint
CREATE INDEX "events_project_metric_ts_idx" ON "events" ("project_id","metric_id","timestamp");--> statement-breakpoint
CREATE INDEX "invoice_items_invoice_idx" ON "invoice_items" ("invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_project_customer_status_idx" ON "invoices" ("project_id","customer_id","status");--> statement-breakpoint
CREATE INDEX "price_tiers_price_idx" ON "price_tiers" ("price_id");--> statement-breakpoint
CREATE INDEX "prices_plan_idx" ON "prices" ("plan_id");--> statement-breakpoint
CREATE INDEX "prices_project_metric_idx" ON "prices" ("project_id","metric_id");--> statement-breakpoint
CREATE INDEX "subscription_price_intervals_sub_idx" ON "subscription_price_intervals" ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_project_customer_idx" ON "subscriptions" ("project_id","customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_project_status_idx" ON "subscriptions" ("project_id","status");--> statement-breakpoint
CREATE INDEX "usage_aggregates_project_customer_idx" ON "usage_aggregates" ("project_id","customer_id","metric_id");--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_metric_id_metrics_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_price_id_prices_id_fkey" FOREIGN KEY ("price_id") REFERENCES "prices"("id");--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_metric_id_metrics_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id");--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_parent_id_plans_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "price_tiers" ADD CONSTRAINT "price_tiers_price_id_prices_id_fkey" FOREIGN KEY ("price_id") REFERENCES "prices"("id");--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_metric_id_metrics_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "subscription_price_intervals" ADD CONSTRAINT "subscription_price_intervals_2qJEbKXN4eU7_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id");--> statement-breakpoint
ALTER TABLE "subscription_price_intervals" ADD CONSTRAINT "subscription_price_intervals_price_id_prices_id_fkey" FOREIGN KEY ("price_id") REFERENCES "prices"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "usage_aggregates" ADD CONSTRAINT "usage_aggregates_project_id_projects_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "usage_aggregates" ADD CONSTRAINT "usage_aggregates_metric_id_metrics_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id");--> statement-breakpoint
ALTER TABLE "usage_aggregates" ADD CONSTRAINT "usage_aggregates_customer_id_customers_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id");--> statement-breakpoint
ALTER TABLE "usage_processed_events" ADD CONSTRAINT "usage_processed_events_event_id_events_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id");