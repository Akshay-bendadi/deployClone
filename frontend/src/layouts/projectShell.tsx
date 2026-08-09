import type { ReactNode } from "react";

import { ArrowLeft, ArrowUpRight, FolderGit2, GitBranch, Pencil } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";

import { ProjectNav } from "../components/layout/projectNav";
import { CreateReleaseForm } from "../components/releases/createReleaseForm";
import { ReleaseStatusBadge } from "../components/status/releaseStatusBadge";
import { Skeleton } from "../components/ui/skeleton";
import { useProjectQuery } from "../hooks/queries/useProjects";
import { useReleasesQuery } from "../hooks/queries/useReleases";
import { ZEROPS_RUNTIMES } from "../lib/zeropsRuntimes";

function runtimeLabel(value: string): string {
  return ZEROPS_RUNTIMES.find((r) => r.value === value)?.label ?? value;
}

function MetaChip({
  icon,
  children,
  href,
}: {
  icon: ReactNode;
  children: ReactNode;
  href?: string;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {icon}
        {children}
        <ArrowUpRight className="h-3 w-3" />
      </a>
    );
  }
  return (
    <span className={className}>
      {icon}
      {children}
    </span>
  );
}

function ProjectShellSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-9 w-72" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
      <div className="flex gap-4 border-b border-border pb-2.5">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
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
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div>
            <p className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              <FolderGit2 className="h-3.5 w-3.5" />
              {project.repository}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-[-0.03em]">{project.name}</h1>
              <Link
                to={`/projects/${project.id}/edit`}
                aria-label="Edit project"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {latestRelease ? <ReleaseStatusBadge status={latestRelease.status} /> : null}
            <MetaChip icon={<GitBranch className="h-3 w-3" />}>
              {project.production_branch}
            </MetaChip>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              {runtimeLabel(project.zerops_runtime)}
            </span>
            <MetaChip icon={null} href={project.production_url}>
              Production
            </MetaChip>
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
