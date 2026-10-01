"use client";

import { Zap } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export default function EventsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Events"
        description="Inspect the raw usage events streamed in from your application."
      />
      <ComingSoon
        icon={Zap}
        title="Event stream is coming soon"
        description="Once the ingestion API is live, events will be validated, deduplicated by idempotency key, and rolled up into usage aggregates."
        endpoint="POST /api/v1/events"
      />
    </div>
  );
}
