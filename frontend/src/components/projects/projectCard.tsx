import { ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ZEROPS_RUNTIMES } from "../../lib/zeropsRuntimes";
import type { Project } from "../../types/domain";
import { ReleaseStatusBadge } from "../status/releaseStatusBadge";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DeleteProjectDialog } from "./deleteProjectDialog";

function runtimeLabel(value: string): string {
  return ZEROPS_RUNTIMES.find((r) => r.value === value)?.label ?? value;
}

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <Card className="group grid gap-4 p-5 transition hover:border-primary/40 hover:shadow-md">
      <Link to={`/projects/${project.id}`} className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <p className="text-lg font-semibold tracking-[-0.01em]">{project.name}</p>
          {project.latest_release_status ? (
            <ReleaseStatusBadge status={project.latest_release_status} />
          ) : (
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              No releases
            </span>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{project.repository}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          Production {project.production_branch}@{project.production_commit_sha.slice(0, 7)}
          <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
        </p>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {runtimeLabel(project.zerops_runtime)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
            Edit
          </Button>
          <DeleteProjectDialog
            project={project}
            trigger={<Button variant="outline">Delete</Button>}
          />
        </div>
      </div>
    </Card>
  );
}
