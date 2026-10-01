"use client";

import { Layers } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export default function PlansPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Plans & Pricing"
        description="Compose fixed fees and usage-based prices into sellable plans."
      />
      <ComingSoon
        icon={Layers}
        title="Pricing is coming soon"
        description="Model unit and tiered prices, version them by effective date, and attach them to plans. Requires the pricing API."
        endpoint="POST /api/v1/plans"
      />
    </div>
  );
}
