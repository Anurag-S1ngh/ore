"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { clearIdentity, setIdentity } from "@/lib/identity";
import type { ApiKey, Cadence, CreatedApiKey, Currency, Customer, Invoice, InvoiceStatus, Metric, Plan, Price, Project, Subscription, SubscriptionStatus, UsageBucket, UsageEvent, UsageGranularity } from "@/lib/types";

export const queryKeys = {
  projects: ["projects"] as const,
  customers: (projectId: string) => ["customers", projectId] as const,
  apiKeys: (projectId: string) => ["api-keys", projectId] as const,
  plans: (projectId: string) => ["plans", projectId] as const,
  metrics: (projectId: string) => ["metrics", projectId] as const,
  prices: (projectId: string, planId: string) =>
    ["prices", projectId, planId] as const,
  invoices: (projectId: string, filters?: { customerId?: string; status?: InvoiceStatus }) =>
    ["invoices", projectId, filters?.customerId ?? "all", filters?.status ?? "all"] as const,
  invoice: (projectId: string, invoiceId: string) =>
    ["invoice", projectId, invoiceId] as const,
  subscriptions: (
    projectId: string,
    filters?: { customerId?: string; planId?: string; status?: SubscriptionStatus },
  ) =>
    [
      "subscriptions",
      projectId,
      filters?.customerId ?? "all",
      filters?.planId ?? "all",
      filters?.status ?? "all",
    ] as const,
  subscription: (projectId: string, subscriptionId: string) =>
    ["subscription", projectId, subscriptionId] as const,
};

/* ---------------------------------- auth --------------------------------- */

export function useSendOtp() {
  return useMutation({
    mutationFn: (input: { email: string; username: string }) =>
      apiFetch<{ status: string }>("/auth/send-otp", {
        method: "POST",
        body: input,
      }),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (input: { email: string; otp: string }) =>
      apiFetch<{ status: string }>("/auth/verify-otp", {
        method: "POST",
        body: input,
      }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ status: string }>("/auth/logout", { method: "POST" }),
    onSettled: () => {
      clearIdentity();
      queryClient.clear();
    },
  });
}

export function rememberIdentity(email: string, username: string) {
  setIdentity({ email, username });
}

/* -------------------------------- projects ------------------------------- */

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => apiFetch<{ projects: Project[] }>("/projects").then((r) => r.projects),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; description: string; defaultCurrency: Currency }) =>
      apiFetch<{ project: Project }>("/projects", { method: "POST", body: input }).then(
        (r) => r.project,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      ...input
    }: {
      projectId: string;
      name?: string;
      description?: string;
      defaultCurrency?: Currency;
    }) =>
      apiFetch<{ project: Project }>(`/projects/${projectId}`, {
        method: "PATCH",
        body: input,
      }).then((r) => r.project),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      apiFetch<{ status: string }>(`/projects/${projectId}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.projects }),
  });
}

/* -------------------------------- customers ------------------------------ */

export function useCustomers(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.customers(projectId ?? "none"),
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ customers: Customer[] }>(`/customers/${projectId}/`).then((r) => r.customers),
  });
}

export function useCreateCustomer(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      externalId: string;
      name?: string;
      email?: string;
      phone?: string;
    }) =>
      apiFetch<{ customer: Customer }>(`/customers/${projectId}/`, {
        method: "POST",
        body: input,
      }).then((r) => r.customer),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(projectId ?? "none") }),
  });
}

export function useUpdateCustomer(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      customerId,
      ...input
    }: {
      customerId: string;
      name?: string;
      email?: string;
      phone?: string;
    }) =>
      apiFetch<{ customer: Customer }>(`/customers/${projectId}/${customerId}`, {
        method: "PUT",
        body: input,
      }).then((r) => r.customer),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(projectId ?? "none") }),
  });
}

export function useDeleteCustomer(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (customerId: string) =>
      apiFetch<{ customer: Customer }>(`/customers/${projectId}/${customerId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.customers(projectId ?? "none") }),
  });
}

/* --------------------------------- api keys ------------------------------ */

export function useApiKeys(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.apiKeys(projectId ?? "none"),
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ apiKeys: ApiKey[] }>(`/api-keys/${projectId}`).then((r) => r.apiKeys),
  });
}

export function useCreateApiKey(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; expiresAt?: string }) =>
      apiFetch<{ apiKey: CreatedApiKey }>(`/api-keys/${projectId}`, {
        method: "POST",
        body: input,
      }).then((r) => r.apiKey),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys(projectId ?? "none") }),
  });
}

export function useRevokeApiKey(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      apiFetch<{ apiKey: Pick<ApiKey, "id" | "revokedAt"> }>(
        `/api-keys/${projectId}/${keyId}`,
        { method: "DELETE" },
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys(projectId ?? "none") }),
  });
}

/* --------------------------------- plans --------------------------------- */

export function usePlans(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.plans(projectId ?? "none"),
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ plans: Plan[] }>(`/plans/${projectId}`).then((r) => r.plans),
  });
}

export function useCreatePlan(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      externalPlanId: string;
      parentId?: string;
    }) =>
      apiFetch<{ plan: Plan }>(`/plans/${projectId}`, {
        method: "POST",
        body: input,
      }).then((r) => r.plan),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.plans(projectId ?? "none") }),
  });
}

export function useUpdatePlan(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      ...input
    }: {
      planId: string;
      name?: string;
      description?: string | null;
      externalPlanId?: string;
      parentId?: string | null;
    }) =>
      apiFetch<{ plan: Plan }>(`/plans/${projectId}/${planId}`, {
        method: "PATCH",
        body: input,
      }).then((r) => r.plan),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.plans(projectId ?? "none") }),
  });
}

export function useDeletePlan(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) =>
      apiFetch<{ plan: Plan }>(`/plans/${projectId}/${planId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.plans(projectId ?? "none") }),
  });
}

/* --------------------------------- prices -------------------------------- */

export type PriceTierInput = {
  firstUnit: number;
  lastUnit?: number | null;
  unitAmount: number;
};

export function usePrices(projectId: string | undefined, planId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.prices(projectId ?? "none", planId ?? "none"),
    enabled: Boolean(projectId && planId),
    queryFn: () =>
      apiFetch<{ prices: Price[] }>(`/prices/${projectId}/plans/${planId}/all`).then(
        (r) => r.prices,
      ),
  });
}

export function useCreatePrice(
  projectId: string | undefined,
  planId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      metricId: string;
      modelType: "unit" | "tiered";
      cadence: Cadence;
      externalPriceId: string;
      currency?: Currency;
      unitAmount?: number | null;
      tiers?: PriceTierInput[];
    }) =>
      apiFetch<{ price: Price }>(`/prices/${projectId}/plans/${planId}`, {
        method: "POST",
        body: input,
      }).then((r) => r.price),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices(projectId ?? "none", planId ?? "none"),
      }),
  });
}

export function useUpdatePrice(
  projectId: string | undefined,
  planId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      priceId,
      ...input
    }: {
      priceId: string;
      metricId?: string;
      modelType?: "unit" | "tiered";
      cadence?: Cadence;
      externalPriceId?: string;
      currency?: Currency;
      unitAmount?: number | null;
      tiers?: PriceTierInput[] | null;
    }) =>
      apiFetch<{ price: Price }>(`/prices/${projectId}/plans/${planId}/${priceId}`, {
        method: "PATCH",
        body: input,
      }).then((r) => r.price),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices(projectId ?? "none", planId ?? "none"),
      }),
  });
}

export function useDeletePrice(
  projectId: string | undefined,
  planId: string | undefined,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (priceId: string) =>
      apiFetch<{ price: Price }>(`/prices/${projectId}/${priceId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.prices(projectId ?? "none", planId ?? "none"),
      }),
  });
}

/* -------------------------------- metrics -------------------------------- */

export function useMetrics(projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.metrics(projectId ?? "none"),
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ metrics: Metric[] }>(`/metrics/${projectId}/`).then(
        (r) => r.metrics,
      ),
  });
}

export function useCreateMetric(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      unit: string;
      aggregation: "sum" | "max" | "count";
    }) =>
      apiFetch<{ metric: Metric }>(`/metrics/${projectId}/`, {
        method: "POST",
        body: input,
      }).then((r) => r.metric),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics(projectId ?? "none"),
      }),
  });
}

export function useDeleteMetric(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (metricId: string) =>
      apiFetch<{ metric: Metric }>(`/metrics/${projectId}/${metricId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.metrics(projectId ?? "none"),
      }),
  });
}

/* --------------------------------- usage --------------------------------- */

export type UsageFilters = {
  period: string;
  granularity?: UsageGranularity;
  metricId?: string;
  customerId?: string;
};

export function useUsage(projectId: string | undefined, filters: UsageFilters | undefined) {
  const params = new URLSearchParams();
  if (filters) {
    params.set("period", filters.period);
    if (filters.granularity) params.set("granularity", filters.granularity);
    if (filters.metricId) params.set("metricId", filters.metricId);
    if (filters.customerId) params.set("customerId", filters.customerId);
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return useQuery({
    queryKey: [
      "usage",
      projectId ?? "none",
      filters?.period ?? "none",
      filters?.granularity ?? "hour",
      filters?.metricId ?? "all",
      filters?.customerId ?? "all",
    ] as const,
    enabled: Boolean(projectId && filters?.period),
    queryFn: () =>
      apiFetch<{ usage: UsageBucket[] }>(`/usage/${projectId}${suffix}`).then(
        (r) => r.usage,
      ),
  });
}

/* --------------------------------- events -------------------------------- */

export type EventFilters = {
  metricId?: string;
  customerId?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export function useEvents(
  projectId: string | undefined,
  filters: EventFilters | undefined,
) {
  const baseParams = new URLSearchParams();
  if (filters?.metricId) baseParams.set("metricId", filters.metricId);
  if (filters?.customerId) baseParams.set("customerId", filters.customerId);
  if (filters?.from) baseParams.set("from", filters.from);
  if (filters?.to) baseParams.set("to", filters.to);
  if (filters?.limit) baseParams.set("limit", String(filters.limit));
  const base = baseParams.toString();
  return useInfiniteQuery({
    queryKey: [
      "events",
      projectId ?? "none",
      filters?.metricId ?? "all",
      filters?.customerId ?? "all",
      filters?.from ?? "all",
      filters?.to ?? "all",
      filters?.limit ?? 20,
    ] as const,
    enabled: Boolean(projectId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams(base);
      if (pageParam) params.set("cursor", pageParam);
      const suffix = params.size > 0 ? `?${params.toString()}` : "";
      return apiFetch<{ events: UsageEvent[]; nextCursor: string | null }>(
        `/events/${projectId}${suffix}`,
      );
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useEvent(projectId: string | undefined, eventId: string | undefined) {
  return useQuery({
    queryKey: ["event", projectId ?? "none", eventId ?? "none"] as const,
    enabled: Boolean(projectId && eventId),
    queryFn: () =>
      apiFetch<{ event: UsageEvent }>(`/events/${projectId}/${eventId}`).then(
        (r) => r.event,
      ),
  });
}

/* ------------------------------ subscriptions ---------------------------- */

export type SubscriptionFilters = {
  customerId?: string;
  planId?: string;
  status?: SubscriptionStatus;
};

export function useSubscriptions(
  projectId: string | undefined,
  filters?: SubscriptionFilters,
) {
  const params = new URLSearchParams();
  if (filters?.customerId) params.set("customerId", filters.customerId);
  if (filters?.planId) params.set("planId", filters.planId);
  if (filters?.status) params.set("status", filters.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return useQuery({
    queryKey: queryKeys.subscriptions(projectId ?? "none", filters),
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ subscriptions: Subscription[] }>(
        `/subscriptions/${projectId}${suffix}`,
      ).then((r) => r.subscriptions),
  });
}

export function useSubscription(
  projectId: string | undefined,
  subscriptionId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.subscription(projectId ?? "none", subscriptionId ?? "none"),
    enabled: Boolean(projectId && subscriptionId),
    queryFn: () =>
      apiFetch<{ subscription: Subscription }>(
        `/subscriptions/${projectId}/${subscriptionId}`,
      ).then((r) => r.subscription),
  });
}

export function useCreateSubscription(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      customerId: string;
      planId: string;
      externalSubscriptionId: string;
      cadence: Cadence;
      startDate?: string;
    }) =>
      apiFetch<{ subscription: Subscription }>(`/subscriptions/${projectId}`, {
        method: "POST",
        body: input,
      }).then((r) => r.subscription),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", projectId ?? "none"],
      }),
  });
}

export function useUpdateSubscription(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subscriptionId,
      ...input
    }: {
      subscriptionId: string;
      planId?: string;
      cadence?: Cadence;
      priceIds?: string[];
    }) =>
      apiFetch<{ subscription: Subscription }>(
        `/subscriptions/${projectId}/${subscriptionId}`,
        { method: "PATCH", body: input },
      ).then((r) => r.subscription),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", projectId ?? "none"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription(projectId ?? "none", variables.subscriptionId),
      });
    },
  });
}

export function useCancelSubscription(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      apiFetch<{ subscription: Subscription }>(
        `/subscriptions/${projectId}/${subscriptionId}`,
        { method: "DELETE" },
      ),
    onSuccess: (_data, subscriptionId) => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", projectId ?? "none"],
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription(projectId ?? "none", subscriptionId),
      });
    },
  });
}

/* -------------------------------- invoices ------------------------------- */

export type InvoiceFilters = { customerId?: string; status?: InvoiceStatus };

export function useInvoices(projectId: string | undefined, filters?: InvoiceFilters) {
  const params = new URLSearchParams();
  if (filters?.customerId) params.set("customerId", filters.customerId);
  if (filters?.status) params.set("status", filters.status);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return useQuery({
    queryKey: queryKeys.invoices(projectId ?? "none", filters),
    enabled: Boolean(projectId),
    queryFn: () =>
      apiFetch<{ invoices: Invoice[] }>(`/invoices/${projectId}${suffix}`).then(
        (r) => r.invoices,
      ),
  });
}

export function useInvoice(projectId: string | undefined, invoiceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invoice(projectId ?? "none", invoiceId ?? "none"),
    enabled: Boolean(projectId && invoiceId),
    queryFn: () =>
      apiFetch<{ invoice: Invoice }>(`/invoices/${projectId}/${invoiceId}`).then(
        (r) => r.invoice,
      ),
  });
}

export function useCreateInvoice(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      customerId: string;
      periodStart: string;
      periodEnd: string;
      dueDate?: string;
    }) =>
      apiFetch<{ invoice: Invoice }>(`/invoices/${projectId}`, {
        method: "POST",
        body: input,
      }).then((r) => r.invoice),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId ?? "none"] }),
  });
}

export function useUpdateInvoiceStatus(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
      apiFetch<{ invoice: Invoice }>(`/invoices/${projectId}/${invoiceId}`, {
        method: "PATCH",
        body: { status },
      }).then((r) => r.invoice),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId ?? "none"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoice(projectId ?? "none", variables.invoiceId),
      });
    },
  });
}

export function useDeleteInvoice(projectId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) =>
      apiFetch<{ invoice: Invoice }>(`/invoices/${projectId}/${invoiceId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["invoices", projectId ?? "none"] }),
  });
}
