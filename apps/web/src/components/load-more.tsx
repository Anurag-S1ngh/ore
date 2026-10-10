"use client";

import { Button } from "@ore/ui/components/button";

export function LoadMore({
  hasNextPage,
  isFetching,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
}) {
  if (!hasNextPage) {
    return null;
  }
  return (
    <div className="px-4">
      <Button variant="outline" size="sm" onClick={onLoadMore} disabled={isFetching}>
        {isFetching ? "Loading…" : "Load more"}
      </Button>
    </div>
  );
}
