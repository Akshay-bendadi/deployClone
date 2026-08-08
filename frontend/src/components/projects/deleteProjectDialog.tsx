import type { ReactNode } from "react";
import { useState } from "react";

import { toast } from "sonner";

import { useDeleteProjectMutation } from "../../hooks/queries/useProjects";
import type { Project } from "../../types/domain";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function DeleteProjectDialog({
  project,
  trigger,
}: {
  project: Project;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteProjectMutation();

  function handleDelete() {
    deleteMutation.mutate(project.id, {
      onSuccess: () => {
        toast.success("Project deleted");
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {project.name}?</DialogTitle>
          <DialogDescription>
            This permanently deletes the project and all of its releases, workflows, and test
            history. This can&rsquo;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            className="bg-block text-block-foreground hover:opacity-90"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
