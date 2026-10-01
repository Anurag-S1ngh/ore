"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";
import { clearIdentity, setIdentity } from "@/lib/identity";
import type { ApiKey, CreatedApiKey, Currency, Customer, Project } from "@/lib/types";

export const queryKeys = {
  projects: ["projects"] as const,
  customers: (projectId: string) => ["customers", projectId] as const,
  apiKeys: (projectId: string) => ["api-keys", projectId] as const,
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
