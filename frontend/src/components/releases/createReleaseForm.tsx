import type { SubmitHandler } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import { useProjectBranchesQuery } from "../../hooks/queries/useBranches";
import { useCreateReleaseMutation } from "../../hooks/queries/useReleases";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const createReleaseSchema = z.object({
  version: z.string().min(1, "Version is required"),
  branch: z.string().min(1, "Branch is required"),
});

type CreateReleaseValues = z.infer<typeof createReleaseSchema>;

export function CreateReleaseForm({ projectId }: { projectId: string }) {
  const branchesQuery = useProjectBranchesQuery(projectId);
  const branches = branchesQuery.data ?? [];

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
          Pick a branch to test — deployClone resolves its latest commit via GitHub automatically.
        </p>
      </div>
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
        <Label className="grid gap-2">
          <span>
            Version label <span className="text-block">*</span>
          </span>
          <Input {...form.register("version")} placeholder="v1.1.0" />
          {form.formState.errors.version ? (
            <span className="text-xs text-block">{form.formState.errors.version.message}</span>
          ) : null}
        </Label>
        <Label className="grid gap-2">
          <span>
            Branch <span className="text-block">*</span>
          </span>
          {branchesQuery.isError ? (
            <Input
              {...form.register("branch")}
              placeholder="main"
              aria-label="Branch (couldn't load branch list, type it manually)"
            />
          ) : (
            <Controller
              control={form.control}
              name="branch"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={branchesQuery.isLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        branchesQuery.isLoading ? "Loading branches..." : "Select a branch"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch} value={branch}>
                        {branch}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
          {branchesQuery.isError ? (
            <span className="text-xs text-muted-foreground">
              Couldn&rsquo;t fetch branches from GitHub &mdash; type the branch name directly.
            </span>
          ) : null}
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
