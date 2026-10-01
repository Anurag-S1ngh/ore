"use client";

import { FileText } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export default function InvoicesPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Invoices"
        description="Draft, issue, and reconcile invoices generated from usage."
      />
      <ComingSoon
        icon={FileText}
        title="Invoicing is coming soon"
        description="Line items will be assembled from fixed fees and metered usage for each billing period, then issued and tracked to payment."
        endpoint="GET /api/v1/invoices"
      />
    </div>
  );
}
