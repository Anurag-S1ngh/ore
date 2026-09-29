import {
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export const invoiceStatusEnum = pgEnum("invoice_status_enum", [
  "draft",
  "pending",
  "paid",
]);

export const cadenceEnum = pgEnum("cadence_enum", ["monthly", "yearly"]);

export const priceModelTypeEnum = pgEnum("price_model_type_enum", [
  "unit",
  "tiered",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status_enum", [
  "active",
  "upcoming",
  "canceled",
]);

export const granularityEnum = pgEnum("granularity_enum", [
  "hour",
  "day",
  "week",
  "month",
]);

export const metricsAggregationEnum = pgEnum("aggregation_enum", [
  "sum",
  "max",
  "count",
]);

export const lineItemTypeEnum = pgEnum("line_item_type_enum", [
  "fixed",
  "usage",
]);

export const currencyEnum = pgEnum("currency_enum", ["USD", "JPY", "INR"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  defaultCurrency: currencyEnum("default_currency").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    name: text("name").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull().unique(),

    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("api_keys_project_idx").on(t.projectId)],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    externalId: text("external_id").notNull(), // customer id from your own db
    name: text("name"),
    email: text("email"),
    phone: text("phone"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.projectId, t.externalId),
    index("customers_project_email_idx").on(t.projectId, t.email),
  ],
);

export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit").notNull(),
    aggregation: metricsAggregationEnum("aggregation").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique().on(t.projectId, t.name)],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    metricId: uuid("metric_id")
      .references(() => metrics.id)
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id)
      .notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    quantity: decimal("quantity", { precision: 20, scale: 6 }).notNull(),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.projectId, t.idempotencyKey),
    index("events_project_customer_ts_idx").on(
      t.projectId,
      t.customerId,
      t.timestamp,
    ),
    index("events_project_metric_ts_idx").on(
      t.projectId,
      t.metricId,
      t.timestamp,
    ),
  ],
);

export const usageAggregates = pgTable(
  "usage_aggregates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    metricId: uuid("metric_id")
      .references(() => metrics.id)
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id)
      .notNull(),
    value: decimal("value", { precision: 20, scale: 6 }).notNull(),
    granularity: granularityEnum("granularity").notNull(),
    aggregation: metricsAggregationEnum("aggregation").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(
      t.projectId,
      t.customerId,
      t.metricId,
      t.granularity,
      t.periodStart,
    ),
    index("usage_aggregates_project_customer_idx").on(
      t.projectId,
      t.customerId,
      t.metricId,
    ),
  ],
);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    externalPlanId: text("external_plan_id").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => plans.id),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique().on(t.projectId, t.externalPlanId)],
);

export const prices = pgTable(
  "prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    planId: uuid("plan_id")
      .references(() => plans.id)
      .notNull(),
    metricId: uuid("metric_id").references(() => metrics.id), // null = fixed fee
    unitAmount: decimal("unit_amount", { precision: 20, scale: 6 }),
    currency: currencyEnum("currency").notNull(),
    modelType: priceModelTypeEnum("model_type").notNull(),
    cadence: cadenceEnum("cadence").notNull(),
    externalPriceId: text("external_price_id").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.projectId, t.externalPriceId),
    index("prices_plan_idx").on(t.planId),
    index("prices_project_metric_idx").on(t.projectId, t.metricId),
  ],
);

export const priceTiers = pgTable(
  "price_tiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    priceId: uuid("price_id")
      .references(() => prices.id)
      .notNull(),
    firstUnit: decimal("first_unit", { precision: 20, scale: 6 }).notNull(),
    lastUnit: decimal("last_unit", { precision: 20, scale: 6 }), // null = open-ended top tier
    unitAmount: decimal("unit_amount", { precision: 20, scale: 6 }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.priceId, t.firstUnit),
    index("price_tiers_price_idx").on(t.priceId),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    planId: uuid("plan_id")
      .references(() => plans.id)
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id)
      .notNull(),
    status: subscriptionStatusEnum("status").notNull(),
    externalSubscriptionId: text("external_subscription_id").notNull(),
    cadence: cadenceEnum("cadence").notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }), // null while ongoing
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
  },
  (t) => [
    unique().on(t.projectId, t.externalSubscriptionId),
    index("subscriptions_project_customer_idx").on(t.projectId, t.customerId),
    index("subscriptions_project_status_idx").on(t.projectId, t.status),
  ],
);

export const subscriptionPriceIntervals = pgTable(
  "subscription_price_intervals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    subscriptionId: uuid("subscription_id")
      .references(() => subscriptions.id)
      .notNull(),
    priceId: uuid("price_id")
      .references(() => prices.id)
      .notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }), // null = currently active interval

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("subscription_price_intervals_sub_idx").on(t.subscriptionId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    subscriptionId: uuid("subscription_id")
      .references(() => subscriptions.id)
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id)
      .notNull(),
    status: invoiceStatusEnum("status").notNull(),
    invoiceNumber: text("invoice_number").notNull(),
    currency: currencyEnum("currency").notNull(),
    totalAmount: decimal("total_amount", { precision: 20, scale: 6 }).notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.projectId, t.invoiceNumber),
    index("invoices_project_customer_status_idx").on(
      t.projectId,
      t.customerId,
      t.status,
    ),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .references(() => invoices.id)
      .notNull(),
    projectId: uuid("project_id")
      .references(() => projects.id)
      .notNull(),
    customerId: uuid("customer_id")
      .references(() => customers.id)
      .notNull(),
    priceId: uuid("price_id").references(() => prices.id),
    metricId: uuid("metric_id").references(() => metrics.id),
    type: lineItemTypeEnum("type").notNull(),
    totalQuantity: decimal("total_quantity", {
      precision: 20,
      scale: 6,
    }).notNull(),
    unitAmount: decimal("unit_amount", { precision: 20, scale: 6 }).notNull(),
    amount: decimal("amount", { precision: 20, scale: 6 }).notNull(),
    currency: currencyEnum("currency").notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }),
    periodEnd: timestamp("period_end", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("invoice_items_invoice_idx").on(t.invoiceId)],
);
