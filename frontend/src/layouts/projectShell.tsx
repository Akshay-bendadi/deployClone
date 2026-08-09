import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";

import { ProjectNav } from "../components/layout/projectNav";
import { CreateReleaseForm } from "../components/releases/createReleaseForm";
import { Skeleton } from "../components/ui/skeleton";
import { useProjectQuery } from "../hooks/queries/useProjects";
import { useReleasesQuery } from "../hooks/queries/useReleases";
import { ZEROPS_RUNTIMES } from "../lib/zeropsRuntimes";

function runtimeLabel(value: string): string {
  return ZEROPS_RUNTIMES.find((r) => r.value === value)?.label ?? value;
}

function ProjectShellSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-56" />
        <Skeleton className="h-8 w-72" />
      </div>
      <div className="flex gap-2 border-b border-border pb-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function ProjectShell() {
  const { projectId } = useParams<{ projectId: string }>();

  const projectQuery = useProjectQuery(projectId);
  const releasesQuery = useReleasesQuery(projectId);

  if (projectQuery.isLoading || releasesQuery.isLoading) {
    return <ProjectShellSkeleton />;
  }

  if (projectQuery.isError || !projectQuery.data || !projectId) {
    return <p className="text-sm text-block">Project not found.</p>;
  }

  const project = projectQuery.data;
  const releases = releasesQuery.data ?? [];
  const latestRelease = releases[0];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              {project.repository}
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{project.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {runtimeLabel(project.zerops_runtime)}
            </span>
            <a
              href={project.production_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              Production
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {!latestRelease ? (
        <CreateReleaseForm projectId={projectId} />
      ) : (
        <>
          <ProjectNav />
          <Outlet context={{ project, latestRelease, releases }} />
        </>
      )}
    </div>
  );
}
