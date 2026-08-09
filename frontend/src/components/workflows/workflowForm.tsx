import type { SubmitHandler } from "react-hook-form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
} from "../../hooks/queries/useWorkflows";
import type { Workflow } from "../../types/domain";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH"]);

const stepSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  method: z.string().min(1),
  path: z.string().min(1, "Path is required"),
  body: z.string(),
});

const workflowFormSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  steps: z.array(stepSchema).min(1, "Add at least one step"),
});

type WorkflowFormValues = z.infer<typeof workflowFormSchema>;

function stepsFromWorkflow(workflow?: Workflow): WorkflowFormValues["steps"] {
  if (!workflow) {
    return [{ name: "", method: "GET", path: "/", body: "" }];
  }
  return workflow.steps.map((step) => ({
    name: step.name,
    method: step.method,
    path: step.path,
    body: step.body ? JSON.stringify(step.body, null, 2) : "",
  }));
}

export function WorkflowForm({
  projectId,
  workflow,
  onSuccess,
}: {
  projectId: string;
  workflow?: Workflow;
  onSuccess: () => void;
}) {
  const isEditMode = !!workflow;

  const form = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: {
      name: workflow?.name ?? "",
      steps: stepsFromWorkflow(workflow),
    },
  });

  const stepFields = useFieldArray({ control: form.control, name: "steps" });
  const createMutation = useCreateWorkflowMutation(projectId);
  const updateMutation = useUpdateWorkflowMutation(projectId, workflow?.id ?? "");
  const activeMutation = isEditMode ? updateMutation : createMutation;

  const onSubmit: SubmitHandler<WorkflowFormValues> = (values) => {
    let parsedSteps;
    try {
      parsedSteps = values.steps.map((step) => ({
        name: step.name,
        method: step.method,
        path: step.path,
        body: step.body.trim() ? JSON.parse(step.body) : null,
      }));
    } catch {
      toast.error("One of your step bodies isn't valid JSON — check for a stray comma or quote.");
      return;
    }

    activeMutation.mutate(
      { name: values.name, steps: parsedSteps },
      {
        onSuccess: () => {
          if (!isEditMode) form.reset();
          onSuccess();
        },
      },
    );
  };

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit(onSubmit)}>
      <Label className="grid gap-2">
        <span>
          Workflow name <span className="text-block">*</span>
        </span>
        <Input {...form.register("name")} placeholder="e.g. Create and fetch order" />
        {form.formState.errors.name ? (
          <span className="text-xs text-block">{form.formState.errors.name.message}</span>
        ) : null}
      </Label>

      <div className="grid gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Steps &mdash; run in order against both production and the twin
        </p>
        {stepFields.fields.map((field, index) => {
          const method = form.watch(`steps.${index}.method`);
          return (
            <div key={field.id} className="grid gap-3 rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Step {index + 1}
                </span>
                {stepFields.fields.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => stepFields.remove(index)}
                    className="text-xs font-medium text-block hover:underline"
                  >
                    Remove step
                  </button>
                ) : null}
              </div>
              <Label className="grid gap-2">
                <span>
                  Step name <span className="text-block">*</span>
                </span>
                <Input {...form.register(`steps.${index}.name`)} placeholder="e.g. Create order" />
              </Label>
              <div className="flex gap-2">
                <Controller
                  control={form.control}
                  name={`steps.${index}.method`}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-32 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTTP_METHODS.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <div className="grid flex-1 gap-1">
                  <Input {...form.register(`steps.${index}.path`)} placeholder="/api/orders" />
                </div>
              </div>
              {METHODS_WITH_BODY.has(method) ? (
                <Label className="grid gap-2">
                  Request body <span className="font-normal text-muted-foreground">(optional)</span>
                  <Textarea
                    {...form.register(`steps.${index}.body`)}
                    placeholder={'{\n  "key": "value"\n}'}
                    className="min-h-[90px] font-mono text-xs"
                  />
                </Label>
              ) : null}
              {form.formState.errors.steps?.[index]?.name ? (
                <span className="text-xs text-block">
                  {form.formState.errors.steps[index]?.name?.message}
                </span>
              ) : null}
              {form.formState.errors.steps?.[index]?.path ? (
                <span className="text-xs text-block">
                  {form.formState.errors.steps[index]?.path?.message}
                </span>
              ) : null}
            </div>
          );
        })}
        <Button
          type="button"
          variant="secondary"
          className="justify-self-start"
          onClick={() => stepFields.append({ name: "", method: "GET", path: "/", body: "" })}
        >
          Add step
        </Button>
        {form.formState.errors.steps?.root || form.formState.errors.steps?.message ? (
          <span className="text-xs text-block">{form.formState.errors.steps.message}</span>
        ) : null}
      </div>

      <Button type="submit" disabled={activeMutation.isPending}>
        {activeMutation.isPending
          ? isEditMode
            ? "Saving..."
            : "Creating..."
          : isEditMode
            ? "Save changes"
            : "Create workflow"}
      </Button>
    </form>
  );
}
