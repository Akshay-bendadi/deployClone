import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { ProjectCard } from "../components/projects/projectCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { useProjectsQuery } from "../hooks/queries/useProjects";

function ProjectCardSkeleton() {
  return (
    <Card className="grid gap-4 p-5">
      <div className="grid gap-2">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-6 w-24 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-16 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export function ProjectsListPage() {
  const navigate = useNavigate();
  const projectsQuery = useProjectsQuery();
  const projects = projectsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Projects</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pick a project to see its latest release, or connect a new one to start testing.
          </p>
        </div>
        <Button className="gap-2" onClick={() => navigate("/projects/new")}>
          <Plus className="h-4 w-4" />
          Add project
        </Button>
      </div>

      {projectsQuery.isError ? (
        <p className="text-sm text-block">Couldn't load projects. Is the backend running?</p>
      ) : null}

      {projectsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <Card className="grid gap-3 p-10 text-center">
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">
            Connect a repository that&rsquo;s already running in production to start testing
            releases against a live twin.
          </p>
          <Button className="mx-auto mt-2 gap-2" onClick={() => navigate("/projects/new")}>
            <Plus className="h-4 w-4" />
            Add project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
