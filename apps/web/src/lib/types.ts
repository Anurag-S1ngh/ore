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

export type CurrencyOption = { value: Currency; label: string };

export const CURRENCIES: CurrencyOption[] = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "INR", label: "INR — Indian Rupee" },
];
