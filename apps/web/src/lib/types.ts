export type Currency = "USD" | "JPY" | "INR";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  userId: string;
  defaultCurrency: Currency;
  createdAt: string;
};

export type Customer = {
  id: string;
  projectId: string;
  externalId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export type CreatedApiKey = ApiKey & { key: string };

export type InvoiceStatus = "draft" | "pending" | "paid";

export type SubscriptionStatus = "active" | "upcoming" | "canceled";

export type Cadence = "monthly" | "yearly";

export type Plan = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  externalPlanId: string;
  parentId: string | null;
  createdAt: string;
};

export type Metric = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  unit: string;
  aggregation: "sum" | "max" | "count";
  createdAt: string;
};

export type UsageGranularity = "hour" | "day" | "week" | "month";

export type UsageBucket = {
  customerId: string;
  metricId: string;
  aggregation?: string;
  periodStart: string;
  periodEnd?: string | null;
  value: string;
  customer?: Customer | null;
  metric?: Metric | null;
};

export type PriceTier = {
  id: string;
  priceId: string;
  firstUnit: string;
  lastUnit: string | null;
  unitAmount: string;
  createdAt: string;
};

export type Price = {
  id: string;
  projectId: string;
  planId: string;
  metricId: string;
  unitAmount: string | null;
  currency: Currency;
  modelType: "unit" | "tiered";
  cadence: Cadence;
  externalPriceId: string;
  createdAt: string;
  priceTiers?: PriceTier[];
  metric?: Metric | null;
};

export type SubscriptionPriceInterval = {
  id: string;
  subscriptionId: string;
  priceId: string;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  price?: {
    id: string;
    metricId: string;
    modelType: "unit" | "tiered";
    unitAmount: string | null;
    currency: Currency;
  } | null;
};

export type Subscription = {
  id: string;
  projectId: string;
  planId: string;
  customerId: string;
  status: SubscriptionStatus;
  externalSubscriptionId: string;
  cadence: Cadence;
  startDate: string;
  endDate: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
  canceledAt: string | null;
  customer?: Customer | null;
  plan?: Plan | null;
  subscriptionPriceIntervals?: SubscriptionPriceInterval[];
};

export type Invoice = {
  id: string;
  projectId: string;
  customerId: string;
  status: InvoiceStatus;
  invoiceNumber: string;
  currency: Currency;
  totalAmount: string;
  periodStart: string | null;
  periodEnd: string | null;
  issuedAt: string;
  paidAt: string | null;
  dueDate: string;
  createdAt: string;
  customer?: Customer | null;
  invoiceItems?: InvoiceItem[];
};

export type InvoiceItem = {
  id: string;
  invoiceId: string;
  projectId: string;
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  metricId: string | null;
  type: "fixed" | "usage";
  totalQuantity: string;
  unitAmount: string;
  amount: string;
  currency: Currency;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  price?: {
    id: string;
    metricId: string;
    modelType: "unit" | "tiered";
    unitAmount: string | null;
    currency: Currency;
  } | null;
  metric?: {
    id: string;
    name: string;
    unit: string;
  } | null;
  subscription?: {
    id: string;
    externalSubscriptionId: string;
  } | null;
};

export type CurrencyOption = { value: Currency; label: string };

export const CURRENCIES: CurrencyOption[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "INR", label: "INR — Indian Rupee" },
];
