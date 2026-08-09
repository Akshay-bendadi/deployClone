import { ArrowUpRight, GitBranch, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { runtimeLabel } from "../../lib/zeropsRuntimes";
import type { Project } from "../../types/domain";
import { ReleaseStatusBadge } from "../status/releaseStatusBadge";
import { TwinGlyph } from "../twinGlyph";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DeleteProjectDialog } from "./deleteProjectDialog";

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <Card className="group grid gap-4 p-5 transition hover:border-primary/40 hover:shadow-md">
      <Link to={`/projects/${project.id}`} className="grid gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <TwinGlyph className="h-4 w-4 shrink-0 text-primary" />
            <p className="text-lg font-semibold tracking-[-0.01em]">{project.name}</p>
          </div>
          {project.latest_release_status ? (
            <ReleaseStatusBadge status={project.latest_release_status} />
          ) : (
            <span className="rounded-full border border-dashed border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              No releases
            </span>
          )}
        </div>
        <p className="truncate font-mono text-xs text-muted-foreground">{project.repository}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <GitBranch className="h-3 w-3 shrink-0" />
          {project.production_branch}@{project.production_commit_sha.slice(0, 7)}
          <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
        </p>
      </Link>
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {runtimeLabel(project.zerops_runtime)}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit project"
            onClick={() => navigate(`/projects/${project.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DeleteProjectDialog
            project={project}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Delete project">
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>
    </Card>
  );
}
