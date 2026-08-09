import { useEffect, useState } from "react";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { SubmitHandler } from "react-hook-form";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  useProjectBranchesQuery,
  useRepositoryBranchesMutation,
} from "../../hooks/queries/useBranches";
import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../../hooks/queries/useProjects";
import { cn } from "../../lib/utils";
import { ZEROPS_RUNTIMES } from "../../lib/zeropsRuntimes";
import type { Project } from "../../types/domain";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Separator } from "../ui/separator";

const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  repository: z.string().min(1, "Repository is required"),
  production_url: z.string().url("Enter a valid URL"),
  zerops_runtime: z.string().min(1, "Runtime is required"),
  production_branch: z.string().min(1, "Branch is required"),
  env_vars: z.array(z.object({ key: z.string().min(1, "Key required"), value: z.string() })),
  github_token: z.string(),
  build_command: z.string(),
  start_command: z.string().min(1, "Start command is required"),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      {[
        { n: 1, label: "Connect repository" },
        { n: 2, label: "Configure" },
      ].map((s, i) => (
        <div key={s.n} className="flex items-center gap-3">
          {i > 0 ? <div className="h-px w-8 bg-border" /> : null}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                step === s.n
                  ? "bg-primary text-primary-foreground"
                  : step > s.n
                    ? "bg-safe/15 text-safe"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                step === s.n ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProjectForm({ project, onSuccess }: { project?: Project; onSuccess: () => void }) {
  const isEditMode = !!project;
  // Edit mode skips the wizard — every field already has a real value, so there's
  // nothing to "reveal" by connecting a repository first.
  const [step, setStep] = useState<1 | 2>(isEditMode ? 2 : 1);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: project
      ? {
          ...project,
          github_token: "",
          build_command: project.build_command ?? "",
          start_command: project.start_command ?? "",
        }
      : {
          name: "",
          repository: "",
          production_url: "",
          zerops_runtime: ZEROPS_RUNTIMES[0].value,
          production_branch: "",
          env_vars: [],
          github_token: "",
          build_command: "",
          start_command: "",
        },
  });

  const envVarFields = useFieldArray({ control: form.control, name: "env_vars" });
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation(project?.id ?? "");
  const activeMutation = isEditMode ? updateMutation : createMutation;

  // Edit mode: auto-load branches using the project's already-stored token. Create
  // mode: fetched explicitly when the user confirms step 1, not on every keystroke.
  const projectBranchesQuery = useProjectBranchesQuery(project?.id);
  const repositoryBranchesMutation = useRepositoryBranchesMutation();
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    if (projectBranchesQuery.data) {
      setBranches(projectBranchesQuery.data);
    }
  }, [projectBranchesQuery.data]);

  function fetchBranches(onDone?: (ok: boolean) => void) {
    const repository = form.getValues("repository");
    const githubToken = form.getValues("github_token");
    if (!repository.trim()) return;
    repositoryBranchesMutation.mutate(
      { repository, githubToken },
      {
        onSuccess: (result) => {
          setBranches(result);
          onDone?.(true);
        },
        onError: () => {
          setBranches([]);
          onDone?.(false);
        },
      },
    );
  }

  async function handleContinue() {
    const valid = await form.trigger(["repository"]);
    if (!valid) return;
    fetchBranches((ok) => {
      if (ok) setStep(2);
    });
  }

  const branchesLoading = projectBranchesQuery.isLoading || repositoryBranchesMutation.isPending;
  const branchesUnavailable =
    !branchesLoading &&
    branches.length === 0 &&
    (repositoryBranchesMutation.isError || projectBranchesQuery.isError);

  const onSubmit: SubmitHandler<ProjectFormValues> = (values) => {
    const payload = { ...values, github_token: values.github_token || undefined };
    activeMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEditMode ? "Project updated" : "Project created");
        if (!isEditMode) {
          form.reset();
          setStep(1);
        }
        onSuccess();
      },
    });
  };

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      {!isEditMode ? <StepIndicator step={step} /> : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <div>
            <p className="text-sm font-medium">Which repository are you testing?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              deployClone reads its branches from GitHub so you can pick one instead of typing it
              &mdash; the next step unlocks once we can see the repository.
            </p>
          </div>
          <Label className="grid gap-2">
            GitHub repository
            <Input
              {...form.register("repository")}
              placeholder="github.com/your-org/your-repo"
              autoFocus
            />
            {form.formState.errors.repository ? (
              <span className="text-xs text-block">{form.formState.errors.repository.message}</span>
            ) : null}
          </Label>
          <Label className="grid gap-2">
            GitHub token
            <Input
              {...form.register("github_token")}
              type="password"
              placeholder="Required for private repos only"
            />
            <span className="text-xs text-muted-foreground">
              A personal access token with repo read access. Only needed if the repository above is
              private &mdash; public repos work without one. Encrypted at rest.
            </span>
          </Label>
          {branchesUnavailable ? (
            <p className="text-sm text-block">
              Couldn&rsquo;t read that repository from GitHub &mdash; check the URL (and token, if
              it&rsquo;s private) and try again.
            </p>
          ) : null}
          <Button
            type="button"
            onClick={handleContinue}
            disabled={repositoryBranchesMutation.isPending}
          >
            {repositoryBranchesMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
              </span>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {!isEditMode ? (
              <div className="flex items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-safe" />
                  <span className="font-medium">{form.getValues("repository")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Change repository
                </button>
              </div>
            ) : null}
            <Label className="grid gap-2">
              Project name
              <Input {...form.register("name")} placeholder="e.g. Payments API" />
              {form.formState.errors.name ? (
                <span className="text-xs text-block">{form.formState.errors.name.message}</span>
              ) : null}
            </Label>
            {isEditMode ? (
              <>
                <Label className="grid gap-2">
                  GitHub repository
                  <Input
                    {...form.register("repository", { onBlur: () => fetchBranches() })}
                    placeholder="github.com/your-org/your-repo"
                  />
                  {form.formState.errors.repository ? (
                    <span className="text-xs text-block">
                      {form.formState.errors.repository.message}
                    </span>
                  ) : null}
                </Label>
                <Label className="grid gap-2">
                  GitHub token
                  <Input
                    {...form.register("github_token", { onBlur: () => fetchBranches() })}
                    type="password"
                    placeholder="Leave blank to keep current"
                  />
                  <span className="text-xs text-muted-foreground">
                    Only needed if the repository is private. Encrypted at rest.
                  </span>
                </Label>
              </>
            ) : null}
            <Label className="grid gap-2">
              Runtime
              <Controller
                control={form.control}
                name="zerops_runtime"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a runtime" />
                    </SelectTrigger>
                    <SelectContent>
                      {ZEROPS_RUNTIMES.map((runtime) => (
                        <SelectItem key={runtime.value} value={runtime.value}>
                          {runtime.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <span className="text-xs text-muted-foreground">
                What the twin service runs on. Must match how the repository is actually built.
              </span>
              {form.formState.errors.zerops_runtime ? (
                <span className="text-xs text-block">
                  {form.formState.errors.zerops_runtime.message}
                </span>
              ) : null}
            </Label>
            <Label className="grid gap-2">
              Build command
              <Input {...form.register("build_command")} placeholder="npm run build" />
              <span className="text-xs text-muted-foreground">
                Runs after dependencies are installed automatically for the runtime above. Just the
                app-specific step &mdash; e.g. <code>npm run build</code>, not{" "}
                <code>npm install &amp;&amp; npm run build</code>. Leave blank if nothing needs
                building.
              </span>
            </Label>
            <Label className="grid gap-2">
              Start command
              <Input {...form.register("start_command")} placeholder="npm start" />
              <span className="text-xs text-muted-foreground">
                How the twin boots up. deployClone generates the twin&rsquo;s zerops.yaml from this
                and the runtime above &mdash; your repository doesn&rsquo;t need its own.
              </span>
              {form.formState.errors.start_command ? (
                <span className="text-xs text-block">
                  {form.formState.errors.start_command.message}
                </span>
              ) : null}
            </Label>
          </div>

          <Separator />

          <div className="grid gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Production (already deployed)
            </p>
            <Label className="grid gap-2">
              Production URL
              <Input {...form.register("production_url")} placeholder="https://api.example.com" />
              <span className="text-xs text-muted-foreground">
                The live API deployClone compares each release&rsquo;s twin against.
              </span>
              {form.formState.errors.production_url ? (
                <span className="text-xs text-block">
                  {form.formState.errors.production_url.message}
                </span>
              ) : null}
            </Label>
            <Label className="grid gap-2">
              Production branch
              {branchesUnavailable ? (
                <Input
                  {...form.register("production_branch")}
                  placeholder="main"
                  aria-label="Production branch (couldn't load branch list, type it manually)"
                />
              ) : (
                <Controller
                  control={form.control}
                  name="production_branch"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={branchesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            branchesLoading
                              ? "Loading branches..."
                              : branches.length
                                ? "Select a branch"
                                : "Enter a repository first"
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
              <span className="text-xs text-muted-foreground">
                {branchesUnavailable
                  ? "Couldn't fetch branches from GitHub — type the branch name directly."
                  : "deployClone resolves this to production's current commit automatically."}
              </span>
              {form.formState.errors.production_branch ? (
                <span className="text-xs text-block">
                  {form.formState.errors.production_branch.message}
                </span>
              ) : null}
            </Label>
          </div>

          <Separator />

          <div className="grid gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Twin environment variables
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Synthetic config injected into the twin only (never copied from production) — e.g. a
                twin database URL. Encrypted at rest.
              </p>
            </div>

            {envVarFields.fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input {...form.register(`env_vars.${index}.key`)} placeholder="DATABASE_URL" />
                <Input
                  {...form.register(`env_vars.${index}.value`)}
                  placeholder="postgres://user:pass@host/db"
                />
                <Button type="button" variant="outline" onClick={() => envVarFields.remove(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="secondary"
              className="justify-self-start"
              onClick={() => envVarFields.append({ key: "", value: "" })}
            >
              Add variable
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {!isEditMode ? (
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
            ) : null}
            <Button type="submit" disabled={activeMutation.isPending} className="flex-1">
              {activeMutation.isPending
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                  ? "Save changes"
                  : "Create project"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
