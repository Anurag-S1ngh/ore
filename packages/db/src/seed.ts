import "varlock/auto-load";

import { randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";

import { ENV } from "./env";
import { createDb } from "./index";
import {
  apiKeys,
  customers,
  events,
  invoiceItems,
  invoices,
  metrics,
  plans,
  prices,
  priceTiers,
  projects,
  subscriptionPriceIntervals,
  subscriptions,
  usageAggregates,
  usageProcessedEvent,
  users,
} from "./schema/index";

const SEED_USER = {
  username: "dunamis",
  email: "anuragsingh2313@gmail.com",
};

const db = createDb(ENV);

const now = new Date();
const days = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);
const hours = (n: number) => new Date(now.getTime() + n * 60 * 60 * 1000);
const startOfDay = (offsetDays: number) => {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d;
};
const randomHex = (bytes: number) => randomBytes(bytes).toString("hex");
const apiKeyPrefix = () => `ore_${randomHex(4)}`;

async function upsertUser() {
  const [byEmail] = await db.select().from(users).where(eq(users.email, SEED_USER.email)).limit(1);

  if (byEmail) {
    if (byEmail.username === SEED_USER.username) {
      return byEmail;
    }
    const [updated] = await db
      .update(users)
      .set({ username: SEED_USER.username })
      .where(eq(users.id, byEmail.id))
      .returning();
    return updated ?? byEmail;
  }

  const [byUsername] = await db
    .select()
    .from(users)
    .where(eq(users.username, SEED_USER.username))
    .limit(1);
  if (byUsername) {
    throw new Error(
      `username "${SEED_USER.username}" already belongs to ${byUsername.email}; refusing to reassign`,
    );
  }

  const [created] = await db.insert(users).values(SEED_USER).returning();
  if (!created) {
    throw new Error("failed to create seed user");
  }
  return created;
}

async function resetProjectData(userId: string) {
  const projectRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));
  const projectIds = projectRows.map((row) => row.id);
  if (projectIds.length === 0) {
    return;
  }

  const eventRows = await db
    .select({ id: events.id })
    .from(events)
    .where(inArray(events.projectId, projectIds));
  const subscriptionRows = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(inArray(subscriptions.projectId, projectIds));
  const priceRows = await db
    .select({ id: prices.id })
    .from(prices)
    .where(inArray(prices.projectId, projectIds));

  const eventIds = eventRows.map((row) => row.id);
  const subscriptionIds = subscriptionRows.map((row) => row.id);
  const priceIds = priceRows.map((row) => row.id);

  if (eventIds.length > 0) {
    await db.delete(usageProcessedEvent).where(inArray(usageProcessedEvent.eventId, eventIds));
  }
  if (subscriptionIds.length > 0) {
    await db
      .delete(subscriptionPriceIntervals)
      .where(inArray(subscriptionPriceIntervals.subscriptionId, subscriptionIds));
  }
  if (priceIds.length > 0) {
    await db.delete(priceTiers).where(inArray(priceTiers.priceId, priceIds));
  }
  await db.delete(invoiceItems).where(inArray(invoiceItems.projectId, projectIds));
  await db.delete(invoices).where(inArray(invoices.projectId, projectIds));
  await db.delete(subscriptions).where(inArray(subscriptions.projectId, projectIds));
  await db.delete(prices).where(inArray(prices.projectId, projectIds));
  await db.delete(usageAggregates).where(inArray(usageAggregates.projectId, projectIds));
  await db.delete(events).where(inArray(events.projectId, projectIds));
  await db.delete(plans).where(inArray(plans.projectId, projectIds));
  await db.delete(metrics).where(inArray(metrics.projectId, projectIds));
  await db.delete(customers).where(inArray(customers.projectId, projectIds));
  await db.delete(apiKeys).where(inArray(apiKeys.projectId, projectIds));
  await db.delete(projects).where(eq(projects.userId, userId));
}

async function seed() {
  const user = await upsertUser();
  await resetProjectData(user.id);

  const [project] = await db
    .insert(projects)
    .values({
      name: "Dunamis Cloud",
      description: "Usage-based billing workspace for Dunamis Cloud.",
      slug: "dunamis-cloud",
      userId: user.id,
      defaultCurrency: "USD",
    })
    .returning();
  if (!project) {
    throw new Error("failed to create seed project");
  }
  const projectId = project.id;

  await db.insert(apiKeys).values([
    {
      projectId,
      name: "Production",
      keyPrefix: apiKeyPrefix(),
      keyHash: randomHex(32),
      lastUsedAt: hours(-2),
      createdAt: days(-30),
    },
    {
      projectId,
      name: "Sandbox",
      keyPrefix: apiKeyPrefix(),
      keyHash: randomHex(32),
      createdAt: days(-20),
    },
    {
      projectId,
      name: "Legacy key",
      keyPrefix: apiKeyPrefix(),
      keyHash: randomHex(32),
      revokedAt: days(-5),
      createdAt: days(-60),
    },
  ]);

  const customerRows = await db
    .insert(customers)
    .values([
      {
        projectId,
        externalId: "cus_acme",
        name: "Acme Corp",
        email: "billing@acme.test",
        phone: "+1-555-0100",
        createdAt: days(-25),
      },
      {
        projectId,
        externalId: "cus_globex",
        name: "Globex",
        email: "finance@globex.test",
        phone: "+1-555-0111",
        createdAt: days(-18),
      },
      {
        projectId,
        externalId: "cus_initech",
        name: "Initech",
        email: "ap@initech.test",
        createdAt: days(-10),
      },
      {
        projectId,
        externalId: "cus_umbrella",
        name: "Umbrella Labs",
        email: "billing@umbrella.test",
        phone: "+1-555-0133",
        createdAt: days(-3),
      },
    ])
    .returning();
  const customerByExternalId = new Map(customerRows.map((row) => [row.externalId, row]));
  const acme = customerByExternalId.get("cus_acme");
  const globex = customerByExternalId.get("cus_globex");
  const initech = customerByExternalId.get("cus_initech");
  const umbrella = customerByExternalId.get("cus_umbrella");

  const metricRows = await db
    .insert(metrics)
    .values([
      {
        projectId,
        name: "api_calls",
        description: "Billable API requests",
        unit: "request",
        aggregation: "sum",
      },
      {
        projectId,
        name: "storage_gb",
        description: "Peak gigabytes stored",
        unit: "GB",
        aggregation: "max",
      },
      {
        projectId,
        name: "active_seats",
        description: "Seats in use",
        unit: "seat",
        aggregation: "count",
      },
    ])
    .returning();
  const metricByName = new Map(metricRows.map((row) => [row.name, row]));
  const apiCalls = metricByName.get("api_calls");
  const storage = metricByName.get("storage_gb");
  const seats = metricByName.get("active_seats");

  const planRows = await db
    .insert(plans)
    .values([
      {
        projectId,
        name: "Starter",
        description: "For small teams getting started.",
        externalPlanId: "starter",
      },
      {
        projectId,
        name: "Pro",
        description: "Growing teams with higher usage.",
        externalPlanId: "pro",
      },
      {
        projectId,
        name: "Enterprise",
        description: "Custom limits and dedicated support.",
        externalPlanId: "enterprise",
      },
    ])
    .returning();
  const planByExternalId = new Map(planRows.map((row) => [row.externalPlanId, row]));
  const starter = planByExternalId.get("starter");
  const pro = planByExternalId.get("pro");
  const enterprise = planByExternalId.get("enterprise");

  if (
    !acme ||
    !globex ||
    !initech ||
    !umbrella ||
    !apiCalls ||
    !storage ||
    !seats ||
    !starter ||
    !pro ||
    !enterprise
  ) {
    throw new Error("failed to build seed reference rows");
  }

  const priceRows = await db
    .insert(prices)
    .values([
      {
        projectId,
        planId: starter.id,
        metricId: apiCalls.id,
        unitAmount: "0.002",
        currency: "USD",
        modelType: "unit",
        cadence: "monthly",
        externalPriceId: "starter_api_calls",
      },
      {
        projectId,
        planId: starter.id,
        metricId: seats.id,
        unitAmount: "5",
        currency: "USD",
        modelType: "unit",
        cadence: "monthly",
        externalPriceId: "starter_seats",
      },
      {
        projectId,
        planId: pro.id,
        metricId: apiCalls.id,
        unitAmount: null,
        currency: "USD",
        modelType: "tiered",
        cadence: "monthly",
        externalPriceId: "pro_api_calls",
      },
      {
        projectId,
        planId: pro.id,
        metricId: storage.id,
        unitAmount: "0.10",
        currency: "USD",
        modelType: "unit",
        cadence: "monthly",
        externalPriceId: "pro_storage",
      },
      {
        projectId,
        planId: enterprise.id,
        metricId: apiCalls.id,
        unitAmount: "0.0015",
        currency: "USD",
        modelType: "unit",
        cadence: "monthly",
        externalPriceId: "enterprise_api_calls",
      },
    ])
    .returning();
  const priceByExternalId = new Map(priceRows.map((row) => [row.externalPriceId, row]));
  const starterApiCalls = priceByExternalId.get("starter_api_calls");
  const starterSeats = priceByExternalId.get("starter_seats");
  const proApiCalls = priceByExternalId.get("pro_api_calls");
  const proStorage = priceByExternalId.get("pro_storage");
  const enterpriseApiCalls = priceByExternalId.get("enterprise_api_calls");

  if (!starterApiCalls || !starterSeats || !proApiCalls || !proStorage || !enterpriseApiCalls) {
    throw new Error("failed to build seed price rows");
  }

  await db.insert(priceTiers).values([
    { priceId: proApiCalls.id, firstUnit: "0", lastUnit: "100000", unitAmount: "0.001" },
    { priceId: proApiCalls.id, firstUnit: "100000", lastUnit: "1000000", unitAmount: "0.0008" },
    { priceId: proApiCalls.id, firstUnit: "1000000", lastUnit: null, unitAmount: "0.0005" },
  ]);

  const subscriptionRows = await db
    .insert(subscriptions)
    .values([
      {
        projectId,
        planId: pro.id,
        customerId: acme.id,
        status: "active",
        externalSubscriptionId: "sub_acme_pro",
        cadence: "monthly",
        startDate: days(-60),
        currentPeriodStart: days(-5),
        currentPeriodEnd: days(25),
        createdAt: days(-60),
      },
      {
        projectId,
        planId: starter.id,
        customerId: globex.id,
        status: "active",
        externalSubscriptionId: "sub_globex_starter",
        cadence: "monthly",
        startDate: days(-18),
        currentPeriodStart: days(-18),
        currentPeriodEnd: days(12),
        createdAt: days(-18),
      },
      {
        projectId,
        planId: starter.id,
        customerId: initech.id,
        status: "canceled",
        externalSubscriptionId: "sub_initech_starter",
        cadence: "monthly",
        startDate: days(-40),
        endDate: days(-4),
        canceledAt: days(-4),
        createdAt: days(-40),
      },
      {
        projectId,
        planId: enterprise.id,
        customerId: umbrella.id,
        status: "upcoming",
        externalSubscriptionId: "sub_umbrella_enterprise",
        cadence: "yearly",
        startDate: days(7),
        currentPeriodStart: days(7),
        currentPeriodEnd: days(372),
        createdAt: days(-3),
      },
    ])
    .returning();
  const subscriptionByExternalId = new Map(
    subscriptionRows.map((row) => [row.externalSubscriptionId, row]),
  );
  const acmeSub = subscriptionByExternalId.get("sub_acme_pro");
  const globexSub = subscriptionByExternalId.get("sub_globex_starter");
  const initechSub = subscriptionByExternalId.get("sub_initech_starter");
  const umbrellaSub = subscriptionByExternalId.get("sub_umbrella_enterprise");

  if (!acmeSub || !globexSub || !initechSub || !umbrellaSub) {
    throw new Error("failed to build seed subscription rows");
  }

  await db.insert(subscriptionPriceIntervals).values([
    { subscriptionId: acmeSub.id, priceId: proApiCalls.id, startDate: days(-60) },
    { subscriptionId: acmeSub.id, priceId: proStorage.id, startDate: days(-60) },
    { subscriptionId: globexSub.id, priceId: starterApiCalls.id, startDate: days(-18) },
    { subscriptionId: umbrellaSub.id, priceId: enterpriseApiCalls.id, startDate: days(7) },
  ]);

  const eventRows = await db
    .insert(events)
    .values([
      {
        projectId,
        metricId: apiCalls.id,
        customerId: acme.id,
        idempotencyKey: "evt_acme_0001",
        quantity: "120000",
        timestamp: days(-4),
      },
      {
        projectId,
        metricId: apiCalls.id,
        customerId: acme.id,
        idempotencyKey: "evt_acme_0002",
        quantity: "45000",
        timestamp: days(-3),
      },
      {
        projectId,
        metricId: storage.id,
        customerId: acme.id,
        idempotencyKey: "evt_acme_0003",
        quantity: "512",
        timestamp: days(-3),
      },
      {
        projectId,
        metricId: apiCalls.id,
        customerId: globex.id,
        idempotencyKey: "evt_globex_0001",
        quantity: "47750",
        timestamp: days(-2),
      },
      {
        projectId,
        metricId: apiCalls.id,
        customerId: globex.id,
        idempotencyKey: "evt_globex_0002",
        quantity: "8300",
        timestamp: hours(-20),
      },
      {
        projectId,
        metricId: seats.id,
        customerId: initech.id,
        idempotencyKey: "evt_initech_0001",
        quantity: "4",
        timestamp: days(-6),
      },
      {
        projectId,
        metricId: apiCalls.id,
        customerId: umbrella.id,
        idempotencyKey: "evt_umbrella_0001",
        quantity: "9000",
        timestamp: hours(-8),
      },
      {
        projectId,
        metricId: storage.id,
        customerId: umbrella.id,
        idempotencyKey: "evt_umbrella_0002",
        quantity: "2048",
        timestamp: hours(-6),
      },
    ])
    .returning();

  await db.insert(usageAggregates).values([
    {
      projectId,
      metricId: apiCalls.id,
      customerId: acme.id,
      value: "165000",
      granularity: "day",
      aggregation: "sum",
      periodStart: startOfDay(-4),
      periodEnd: startOfDay(-3),
    },
    {
      projectId,
      metricId: apiCalls.id,
      customerId: globex.id,
      value: "56050",
      granularity: "day",
      aggregation: "sum",
      periodStart: startOfDay(-2),
      periodEnd: startOfDay(-1),
    },
    {
      projectId,
      metricId: storage.id,
      customerId: acme.id,
      value: "512",
      granularity: "day",
      aggregation: "max",
      periodStart: startOfDay(-3),
      periodEnd: startOfDay(-2),
    },
    {
      projectId,
      metricId: apiCalls.id,
      customerId: acme.id,
      value: "165000",
      granularity: "month",
      aggregation: "sum",
      periodStart: startOfDay(-30),
      periodEnd: startOfDay(0),
    },
  ]);

  const invoiceRows = await db
    .insert(invoices)
    .values([
      {
        projectId,
        customerId: acme.id,
        status: "paid",
        invoiceNumber: "INV-1001",
        currency: "USD",
        totalAmount: "240.00",
        periodStart: days(-35),
        periodEnd: days(-5),
        issuedAt: days(-5),
        paidAt: days(-3),
        dueDate: days(10),
      },
      {
        projectId,
        customerId: globex.id,
        status: "pending",
        invoiceNumber: "INV-1002",
        currency: "USD",
        totalAmount: "95.50",
        periodStart: days(-30),
        periodEnd: days(-1),
        issuedAt: days(-1),
        dueDate: days(14),
      },
      {
        projectId,
        customerId: initech.id,
        status: "draft",
        invoiceNumber: "INV-1003",
        currency: "USD",
        totalAmount: "20.00",
        periodStart: days(-30),
        periodEnd: days(-1),
        issuedAt: now,
        dueDate: days(15),
      },
    ])
    .returning();
  const invoiceByNumber = new Map(invoiceRows.map((row) => [row.invoiceNumber, row]));
  const acmeInvoice = invoiceByNumber.get("INV-1001");
  const globexInvoice = invoiceByNumber.get("INV-1002");
  const initechInvoice = invoiceByNumber.get("INV-1003");

  if (!acmeInvoice || !globexInvoice || !initechInvoice) {
    throw new Error("failed to build seed invoice rows");
  }

  await db.insert(invoiceItems).values([
    {
      invoiceId: acmeInvoice.id,
      projectId,
      customerId: acme.id,
      subscriptionId: acmeSub.id,
      priceId: proApiCalls.id,
      metricId: apiCalls.id,
      type: "usage",
      totalQuantity: "120000",
      unitAmount: "0.002",
      amount: "240.00",
      currency: "USD",
      periodStart: days(-35),
      periodEnd: days(-5),
    },
    {
      invoiceId: globexInvoice.id,
      projectId,
      customerId: globex.id,
      subscriptionId: globexSub.id,
      priceId: starterApiCalls.id,
      metricId: apiCalls.id,
      type: "usage",
      totalQuantity: "47750",
      unitAmount: "0.002",
      amount: "95.50",
      currency: "USD",
      periodStart: days(-30),
      periodEnd: days(-1),
    },
    {
      invoiceId: initechInvoice.id,
      projectId,
      customerId: initech.id,
      subscriptionId: initechSub.id,
      priceId: starterSeats.id,
      metricId: null,
      type: "fixed",
      totalQuantity: "4",
      unitAmount: "5",
      amount: "20.00",
      currency: "USD",
      periodStart: days(-30),
      periodEnd: days(-1),
    },
  ]);

  const processedEvents = eventRows.slice(0, 4);
  if (processedEvents.length > 0) {
    await db.insert(usageProcessedEvent).values(
      processedEvents.map((event) => ({
        eventId: event.id,
        processedAt: event.timestamp,
      })),
    );
  }

  console.log(
    [
      "Seed complete.",
      `  user:         ${user.username} <${user.email}> (${user.id})`,
      `  project:      ${project.name} [${project.slug}] (${project.id})`,
      `  customers:    ${customerRows.length}`,
      `  metrics:      ${metricRows.length}`,
      `  plans:        ${planRows.length}`,
      `  prices:       ${priceRows.length}`,
      `  subscriptions:${subscriptionRows.length}`,
      `  events:       ${eventRows.length}`,
      `  invoices:     ${invoiceRows.length}`,
    ].join("\n"),
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
