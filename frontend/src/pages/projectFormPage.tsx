import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { ProjectForm } from "../components/projects/projectForm";
import { Card } from "../components/ui/card";
import { useProjectQuery } from "../hooks/queries/useProjects";

export function ProjectFormPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const isEditMode = !!projectId;
  const projectQuery = useProjectQuery(projectId);

  if (isEditMode && projectQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (isEditMode && (projectQuery.isError || !projectQuery.data)) {
    return <p className="text-sm text-block">Project not found.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All projects
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          {isEditMode ? "Edit project" : "Register a project"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isEditMode
            ? "Update this project's configuration."
            : "Point deployClone at a repository you already have running in production."}
        </p>
      </div>
      <Card className="p-6 sm:p-8">
        <ProjectForm project={projectQuery.data} onSuccess={() => navigate("/projects")} />
      </Card>
    </div>
  );
}
