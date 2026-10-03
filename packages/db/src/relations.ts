import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    projects: r.many.projects({ from: r.users.id, to: r.projects.userId }),
  },
  projects: {
    user: r.one.users({ from: r.projects.userId, to: r.users.id }),
    apiKeys: r.many.apiKeys({ from: r.projects.id, to: r.apiKeys.projectId }),
    customers: r.many.customers({
      from: r.projects.id,
      to: r.customers.projectId,
    }),
    metrics: r.many.metrics({ from: r.projects.id, to: r.metrics.projectId }),
    events: r.many.events({ from: r.projects.id, to: r.events.projectId }),
    usageAggregates: r.many.usageAggregates({
      from: r.projects.id,
      to: r.usageAggregates.projectId,
    }),
    plans: r.many.plans({ from: r.projects.id, to: r.plans.projectId }),
    prices: r.many.prices({ from: r.projects.id, to: r.prices.projectId }),
    subscriptions: r.many.subscriptions({
      from: r.projects.id,
      to: r.subscriptions.projectId,
    }),
    invoices: r.many.invoices({
      from: r.projects.id,
      to: r.invoices.projectId,
    }),
    invoiceItems: r.many.invoiceItems({
      from: r.projects.id,
      to: r.invoiceItems.projectId,
    }),
  },
  apiKeys: {
    project: r.one.projects({
      from: r.apiKeys.projectId,
      to: r.projects.id,
    }),
  },
  customers: {
    project: r.one.projects({
      from: r.customers.projectId,
      to: r.projects.id,
    }),
    events: r.many.events({ from: r.customers.id, to: r.events.customerId }),
    usageAggregates: r.many.usageAggregates({
      from: r.customers.id,
      to: r.usageAggregates.customerId,
    }),
    subscriptions: r.many.subscriptions({
      from: r.customers.id,
      to: r.subscriptions.customerId,
    }),
    invoices: r.many.invoices({
      from: r.customers.id,
      to: r.invoices.customerId,
    }),
    invoiceItems: r.many.invoiceItems({
      from: r.customers.id,
      to: r.invoiceItems.customerId,
    }),
  },
  metrics: {
    project: r.one.projects({ from: r.metrics.projectId, to: r.projects.id }),
    events: r.many.events({ from: r.metrics.id, to: r.events.metricId }),
    usageAggregates: r.many.usageAggregates({
      from: r.metrics.id,
      to: r.usageAggregates.metricId,
    }),
    prices: r.many.prices({ from: r.metrics.id, to: r.prices.metricId }),
    invoiceItems: r.many.invoiceItems({
      from: r.metrics.id,
      to: r.invoiceItems.metricId,
    }),
  },
  events: {
    project: r.one.projects({ from: r.events.projectId, to: r.projects.id }),
    metric: r.one.metrics({ from: r.events.metricId, to: r.metrics.id }),
    customer: r.one.customers({
      from: r.events.customerId,
      to: r.customers.id,
    }),
    usageProcessedEvent: r.one.usageProcessedEvent({
      from: r.events.id,
      to: r.usageProcessedEvent.eventId,
    }),
  },
  usageAggregates: {
    project: r.one.projects({
      from: r.usageAggregates.projectId,
      to: r.projects.id,
    }),
    metric: r.one.metrics({
      from: r.usageAggregates.metricId,
      to: r.metrics.id,
    }),
    customer: r.one.customers({
      from: r.usageAggregates.customerId,
      to: r.customers.id,
    }),
  },
  usageProcessedEvent: {
    event: r.one.events({
      from: r.usageProcessedEvent.eventId,
      to: r.events.id,
    }),
  },
  plans: {
    project: r.one.projects({ from: r.plans.projectId, to: r.projects.id }),
    parent: r.one.plans({ from: r.plans.parentId, to: r.plans.id }),
    children: r.many.plans({ from: r.plans.id, to: r.plans.parentId }),
    prices: r.many.prices({ from: r.plans.id, to: r.prices.planId }),
    subscriptions: r.many.subscriptions({
      from: r.plans.id,
      to: r.subscriptions.planId,
    }),
  },
  prices: {
    project: r.one.projects({ from: r.prices.projectId, to: r.projects.id }),
    plan: r.one.plans({ from: r.prices.planId, to: r.plans.id }),
    metric: r.one.metrics({ from: r.prices.metricId, to: r.metrics.id }),
    priceTiers: r.many.priceTiers({
      from: r.prices.id,
      to: r.priceTiers.priceId,
    }),
    subscriptionPriceIntervals: r.many.subscriptionPriceIntervals({
      from: r.prices.id,
      to: r.subscriptionPriceIntervals.priceId,
    }),
    invoiceItems: r.many.invoiceItems({
      from: r.prices.id,
      to: r.invoiceItems.priceId,
    }),
  },
  priceTiers: {
    price: r.one.prices({ from: r.priceTiers.priceId, to: r.prices.id }),
  },
  subscriptions: {
    project: r.one.projects({
      from: r.subscriptions.projectId,
      to: r.projects.id,
    }),
    plan: r.one.plans({ from: r.subscriptions.planId, to: r.plans.id }),
    customer: r.one.customers({
      from: r.subscriptions.customerId,
      to: r.customers.id,
    }),
    subscriptionPriceIntervals: r.many.subscriptionPriceIntervals({
      from: r.subscriptions.id,
      to: r.subscriptionPriceIntervals.subscriptionId,
    }),
    invoices: r.many.invoices({
      from: r.subscriptions.id,
      to: r.invoices.subscriptionId,
    }),
  },
  subscriptionPriceIntervals: {
    subscription: r.one.subscriptions({
      from: r.subscriptionPriceIntervals.subscriptionId,
      to: r.subscriptions.id,
    }),
    price: r.one.prices({
      from: r.subscriptionPriceIntervals.priceId,
      to: r.prices.id,
    }),
  },
  invoices: {
    project: r.one.projects({ from: r.invoices.projectId, to: r.projects.id }),
    subscription: r.one.subscriptions({
      from: r.invoices.subscriptionId,
      to: r.subscriptions.id,
    }),
    customer: r.one.customers({
      from: r.invoices.customerId,
      to: r.customers.id,
    }),
    invoiceItems: r.many.invoiceItems({
      from: r.invoices.id,
      to: r.invoiceItems.invoiceId,
    }),
  },
  invoiceItems: {
    invoice: r.one.invoices({
      from: r.invoiceItems.invoiceId,
      to: r.invoices.id,
    }),
    project: r.one.projects({
      from: r.invoiceItems.projectId,
      to: r.projects.id,
    }),
    customer: r.one.customers({
      from: r.invoiceItems.customerId,
      to: r.customers.id,
    }),
    price: r.one.prices({ from: r.invoiceItems.priceId, to: r.prices.id }),
    metric: r.one.metrics({ from: r.invoiceItems.metricId, to: r.metrics.id }),
  },
}));
