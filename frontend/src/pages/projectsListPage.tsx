import { useNavigate } from "react-router-dom";

import { ProjectCard } from "../components/projects/projectCard";
import { Button } from "../components/ui/button";
import { useProjectsQuery } from "../hooks/queries/useProjects";

export function ProjectsListPage() {
  const navigate = useNavigate();
  const projectsQuery = useProjectsQuery();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Projects</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick a project to see its latest release.
          </p>
        </div>
        <Button onClick={() => navigate("/projects/new")}>Add project</Button>
      </div>

      <div className="grid gap-3">
        {projectsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading projects...</p>
        ) : null}
        {projectsQuery.isError ? (
          <p className="text-sm text-block">Couldn't load projects. Is the backend running?</p>
        ) : null}
        {projectsQuery.data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No projects yet — click &ldquo;Add project&rdquo; to register one.
          </p>
        ) : null}
        {projectsQuery.data?.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
