"use client";

import { Activity } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export default function UsagePage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Usage"
        description="Aggregated consumption per customer and metric over time."
      />
      <ComingSoon
        icon={Activity}
        title="Usage explorer is coming soon"
        description="Query hourly, daily, weekly, and monthly rollups to see exactly what each customer consumed in a billing period."
        endpoint="GET /api/v1/usage"
      />
    </div>
  );
}
