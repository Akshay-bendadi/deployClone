import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { useCreateReleaseMutation } from "../../hooks/queries/useReleases";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const createReleaseSchema = z.object({
  version: z.string().min(1, "Version is required"),
  branch: z.string().min(1, "Branch is required"),
});

type CreateReleaseValues = z.infer<typeof createReleaseSchema>;

export function CreateReleaseForm({ projectId }: { projectId: string }) {
  const form = useForm<CreateReleaseValues>({
    resolver: zodResolver(createReleaseSchema),
    defaultValues: { version: "", branch: "" },
  });

  const createMutation = useCreateReleaseMutation(projectId);

  const onSubmit: SubmitHandler<CreateReleaseValues> = (values) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast.success("Release created");
        form.reset();
      },
    });
  };

  return (
    <Card className="grid gap-4 p-6">
      <div>
        <p className="text-sm font-medium">No releases yet</p>
        <p className="text-sm text-muted-foreground">
          Give it a branch to test — deployClone resolves the branch&rsquo;s latest commit via
          GitHub automatically.
        </p>
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Label className="grid gap-2">
          Version label
          <Input {...form.register("version")} placeholder="v1.1.0" />
          {form.formState.errors.version ? (
            <span className="text-xs text-block">{form.formState.errors.version.message}</span>
          ) : null}
        </Label>
        <Label className="grid gap-2">
          Branch
          <Input {...form.register("branch")} placeholder="main" />
          {form.formState.errors.branch ? (
            <span className="text-xs text-block">{form.formState.errors.branch.message}</span>
          ) : null}
        </Label>
        <Button type="submit" disabled={createMutation.isPending} className="sm:col-span-2">
          {createMutation.isPending ? "Resolving branch..." : "Create release"}
        </Button>
      </form>
    </Card>
  );
}
