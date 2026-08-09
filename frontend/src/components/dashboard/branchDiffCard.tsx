import { useState } from "react";

import type { BranchDiff } from "../../types/domain";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

const STATUS_LABEL: Record<string, string> = {
  added: "Added",
  removed: "Removed",
  modified: "Modified",
  renamed: "Renamed",
};

const STATUS_CLASS: Record<string, string> = {
  added: "text-safe",
  removed: "text-block",
  modified: "text-primary",
  renamed: "text-muted-foreground",
};

export function BranchDiffCard({
  diff,
  isLoading,
  isError,
  productionBranch,
  releaseBranch,
}: {
  diff: BranchDiff | undefined;
  isLoading: boolean;
  isError: boolean;
  productionBranch: string;
  releaseBranch: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <Card className="grid gap-3 p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-6 w-64" />
      </Card>
    );
  }

  if (isError || !diff) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">
          Couldn&rsquo;t load the diff between {productionBranch} and {releaseBranch} from GitHub.
        </p>
      </Card>
    );
  }

  if (diff.total_commits === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm font-medium">
          {releaseBranch} and {productionBranch} are identical
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          No commits or file changes between what&rsquo;s live in production and this release
          &mdash; this branch is safe to merge purely on the basis of having nothing new to
          introduce.
        </p>
      </Card>
    );
  }

  const filesShown = expanded ? diff.files : diff.files.slice(0, 5);

  return (
    <Card className="grid gap-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          What this changes
        </p>
        <p className="text-xs text-muted-foreground">
          {productionBranch} &rarr; {releaseBranch}
        </p>
      </div>
      <p className="text-sm leading-6">
        <span className="font-semibold">{diff.total_commits}</span>{" "}
        {diff.total_commits === 1 ? "commit" : "commits"} ahead of production, touching{" "}
        <span className="font-semibold">{diff.files.length}</span>{" "}
        {diff.files.length === 1 ? "file" : "files"}.
      </p>
      <div className="grid gap-1.5">
        {filesShown.map((file) => (
          <div key={file.filename} className="flex items-center gap-3 text-sm">
            <span
              className={`w-16 shrink-0 text-xs font-medium ${STATUS_CLASS[file.status] ?? "text-muted-foreground"}`}
            >
              {STATUS_LABEL[file.status] ?? file.status}
            </span>
            <span className="flex-1 truncate font-mono text-xs">{file.filename}</span>
            <span className="shrink-0 font-mono text-xs text-safe">+{file.additions}</span>
            <span className="shrink-0 font-mono text-xs text-block">-{file.deletions}</span>
          </div>
        ))}
      </div>
      {diff.files.length > 5 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="justify-self-start text-xs font-medium text-primary hover:underline"
        >
          {expanded ? "Show fewer files" : `Show all ${diff.files.length} files`}
        </button>
      ) : null}
    </Card>
  );
}
