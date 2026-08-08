import { Link, useNavigate } from "react-router-dom";

import type { Project } from "../../types/domain";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { DeleteProjectDialog } from "./deleteProjectDialog";

export function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();

  return (
    <Card className="grid gap-3 p-5">
      <Link to={`/projects/${project.id}`} className="grid gap-1 transition hover:opacity-80">
        <p className="text-lg font-semibold">{project.name}</p>
        <p className="text-sm text-muted-foreground">{project.repository}</p>
        <p className="text-xs text-muted-foreground">
          Production {project.production_branch}@{project.production_commit_sha.slice(0, 7)}{" "}
          &middot; {project.production_url}
        </p>
      </Link>
      <div className="flex items-center gap-2 border-t border-border pt-3">
        <Button variant="outline" onClick={() => navigate(`/projects/${project.id}/edit`)}>
          Edit
        </Button>
        <DeleteProjectDialog
          project={project}
          trigger={<Button variant="outline">Delete</Button>}
        />
      </div>
    </Card>
  );
}
