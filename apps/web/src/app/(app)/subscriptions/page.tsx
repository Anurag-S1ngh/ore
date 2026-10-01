"use client";

import { Repeat } from "lucide-react";

import { ComingSoon } from "@/components/coming-soon";
import { PageHeader } from "@/components/page-header";

export default function SubscriptionsPage() {
  return (
    <div className="flex min-h-full flex-col">
      <PageHeader
        title="Subscriptions"
        description="Track which customers are enrolled in which plans, and their billing periods."
      />
      <ComingSoon
        icon={Repeat}
        title="Subscriptions are coming soon"
        description="Subscribe customers to plans, handle upgrades and downgrades, and drive recurring invoice generation."
        endpoint="POST /api/v1/subscriptions"
      />
    </div>
  );
}
