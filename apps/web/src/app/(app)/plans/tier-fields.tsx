"use client";

import { Button } from "@ore/ui/components/button";
import { Input } from "@ore/ui/components/input";
import { Label } from "@ore/ui/components/label";
import { Plus, Trash2 } from "lucide-react";

export type TierDraft = { firstUnit: string; lastUnit?: string; unitAmount: string };

export function TierFields({
  tiers,
  onSetTier,
  onAddTier,
  onRemoveTier,
}: {
  tiers: TierDraft[];
  onSetTier: (index: number, patch: Partial<TierDraft>) => void;
  onAddTier: () => void;
  onRemoveTier: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>Tiers</Label>
        <Button type="button" variant="outline" size="sm" onClick={onAddTier}>
          <Plus />
          Add tier
        </Button>
      </div>
      {tiers.map((tier, index) => (
        <div
          key={`${index}-${tier.firstUnit}`}
          className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2"
        >
          <div className="flex flex-col gap-1">
            <Label>First unit</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              value={tier.firstUnit}
              onChange={(e) => onSetTier(index, { firstUnit: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Last unit (empty = ∞)</Label>
            <Input
              placeholder="∞"
              value={tier.lastUnit ?? ""}
              onChange={(e) => onSetTier(index, { lastUnit: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>Unit amount</Label>
            <Input
              type="number"
              step="0.000001"
              min="0"
              value={tier.unitAmount}
              onChange={(e) => onSetTier(index, { unitAmount: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove tier"
            onClick={() => onRemoveTier(index)}
            disabled={tiers.length <= 1}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">
        Only the last tier may be open-ended. Tiers must not overlap.
      </p>
    </div>
  );
}
