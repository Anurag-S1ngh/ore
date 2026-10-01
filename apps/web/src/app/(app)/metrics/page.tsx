"use client";

import { Gauge } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export default function MetricsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Metrics"
        description="Define the billable quantities you aggregate from usage events."
      />
      <ComingSoon
        icon={Gauge}
        title="Metrics are coming soon"
        description="Create metrics such as API calls, storage, or compute seconds, then attach them to prices. This surface is waiting on the metering API."
        endpoint="POST /api/v1/metrics"
      />
    </div>
  );
}
