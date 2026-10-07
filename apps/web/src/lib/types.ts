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
