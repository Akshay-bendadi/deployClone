import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import { WorkflowForm } from "../components/workflows/workflowForm";
import { useDeleteWorkflowMutation, useWorkflowsQuery } from "../hooks/queries/useWorkflows";
import { useProjectContext } from "../hooks/useProjectContext";
import type { Workflow } from "../types/domain";

const METHOD_CLASS: Record<string, string> = {
  GET: "text-safe",
  POST: "text-primary",
  PUT: "text-primary",
  PATCH: "text-primary",
  DELETE: "text-block",
};

function WorkflowRow({ workflow, projectId }: { workflow: Workflow; projectId: string }) {
  const [editOpen, setEditOpen] = useState(false);
  const deleteMutation = useDeleteWorkflowMutation(projectId);

  return (
    <Card className="grid gap-3 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{workflow.name}</p>
        <div className="flex items-center gap-3">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <button type="button" className="text-xs font-medium text-primary hover:underline">
                Edit
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit {workflow.name}</DialogTitle>
              </DialogHeader>
              <WorkflowForm
                projectId={projectId}
                workflow={workflow}
                onSuccess={() => setEditOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <button
            type="button"
            onClick={() => deleteMutation.mutate(workflow.id)}
            disabled={deleteMutation.isPending}
            className="text-xs font-medium text-block hover:underline"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
      <div className="grid gap-1.5">
        {workflow.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <span
              className={`w-14 shrink-0 text-xs font-semibold ${METHOD_CLASS[step.method] ?? "text-muted-foreground"}`}
            >
              {step.method}
            </span>
            <span className="flex-1 truncate font-mono text-xs text-muted-foreground">
              {step.path}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function WorkflowsPage() {
  const { project } = useProjectContext();
  const workflowsQuery = useWorkflowsQuery(project.id);
  const [createOpen, setCreateOpen] = useState(false);
  const workflows = workflowsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">Workflows</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real HTTP sequences run against production and the twin on every test &mdash; this is
            what actually generates Test Run and Evidence results.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add workflow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New workflow</DialogTitle>
            </DialogHeader>
            <WorkflowForm projectId={project.id} onSuccess={() => setCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {workflowsQuery.isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : workflows.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm font-medium">No workflows yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add one to define what deployClone actually tests &mdash; e.g. create a resource, then
            fetch it back. Without at least one workflow, Test Run and Evidence have nothing to
            compare and every release looks trivially safe.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {workflows.map((workflow) => (
            <WorkflowRow key={workflow.id} workflow={workflow} projectId={project.id} />
          ))}
        </div>
      )}
    </div>
  );
}
