import type { SubmitHandler } from "react-hook-form";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { zodResolver } from "@hookform/resolvers/zod";

import {
  useCreateProjectMutation,
  useUpdateProjectMutation,
} from "../../hooks/queries/useProjects";
import { ZEROPS_RUNTIMES } from "../../lib/zeropsRuntimes";
import type { Project } from "../../types/domain";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
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

export function ProjectForm({ project, onSuccess }: { project?: Project; onSuccess: () => void }) {
  const isEditMode = !!project;

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

  const onSubmit: SubmitHandler<ProjectFormValues> = (values) => {
    const payload = { ...values, github_token: values.github_token || undefined };
    activeMutation.mutate(payload, {
      onSuccess: () => {
        toast.success(isEditMode ? "Project updated" : "Project created");
        if (!isEditMode) {
          form.reset();
        }
        onSuccess();
      },
    });
  };

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4">
        <Label className="grid gap-2">
          Project name
          <Input {...form.register("name")} placeholder="e.g. Payments API" />
          {form.formState.errors.name ? (
            <span className="text-xs text-block">{form.formState.errors.name.message}</span>
          ) : null}
        </Label>
        <Label className="grid gap-2">
          GitHub repository
          <Input {...form.register("repository")} placeholder="github.com/your-org/your-repo" />
          <span className="text-xs text-muted-foreground">
            Used to resolve branches and download each release&rsquo;s exact commit for the
            twin build.
          </span>
          {form.formState.errors.repository ? (
            <span className="text-xs text-block">{form.formState.errors.repository.message}</span>
          ) : null}
        </Label>
        <Label className="grid gap-2">
          Runtime
          <Select {...form.register("zerops_runtime")}>
            {ZEROPS_RUNTIMES.map((runtime) => (
              <option key={runtime.value} value={runtime.value}>
                {runtime.label}
              </option>
            ))}
          </Select>
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
            The app should listen on the port set via a <code>PORT</code> environment variable
            below (defaults to 8080).
          </span>
          {form.formState.errors.start_command ? (
            <span className="text-xs text-block">
              {form.formState.errors.start_command.message}
            </span>
          ) : null}
        </Label>
        <Label className="grid gap-2">
          GitHub token
          <Input
            {...form.register("github_token")}
            type="password"
            placeholder={
              isEditMode ? "Leave blank to keep current" : "Required for private repos only"
            }
          />
          <span className="text-xs text-muted-foreground">
            A personal access token with repo read access. Only needed if the repository above is
            private &mdash; public repos work without one.
          </span>
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
          <Input {...form.register("production_branch")} placeholder="main" />
          <span className="text-xs text-muted-foreground">
            deployClone resolves this to production&rsquo;s current commit automatically.
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
            twin database URL.
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

      <Button type="submit" disabled={activeMutation.isPending}>
        {activeMutation.isPending
          ? isEditMode
            ? "Saving..."
            : "Creating..."
          : isEditMode
            ? "Save changes"
            : "Create project"}
      </Button>
    </form>
  );
}
