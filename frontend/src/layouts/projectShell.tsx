import { ArrowLeft } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";

import { ProjectNav } from "../components/layout/projectNav";
import { CreateReleaseForm } from "../components/releases/createReleaseForm";
import { useProjectQuery } from "../hooks/queries/useProjects";
import { useReleasesQuery } from "../hooks/queries/useReleases";

export function ProjectShell() {
  const { projectId } = useParams<{ projectId: string }>();

  const projectQuery = useProjectQuery(projectId);
  const releasesQuery = useReleasesQuery(projectId);

  if (projectQuery.isLoading || releasesQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading project...</p>;
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
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          {project.repository}
        </p>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{project.name}</h1>
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
