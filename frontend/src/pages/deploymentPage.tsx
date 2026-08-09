import { useState } from "react";

import { DeploymentStepRow } from "../components/deployment/deploymentStepRow";
import { TeardownCountdown } from "../components/deployment/teardownCountdown";
import { PageHeader } from "../components/layout/pageHeader";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Skeleton } from "../components/ui/skeleton";
import {
  useDeploymentStepsQuery,
  useTeardownTwinMutation,
} from "../hooks/queries/useDeployments";
import { useEnvironmentsQuery } from "../hooks/queries/useEnvironments";
import { useProjectContext } from "../hooks/useProjectContext";

export function DeploymentPage() {
  const { latestRelease } = useProjectContext();
  const isActive = latestRelease.status === "DEPLOYING" || latestRelease.status === "TESTING";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const twinLabel = `${latestRelease.version} twin`;

  const environmentsQuery = useEnvironmentsQuery(latestRelease.id, isActive);
  const twins = environmentsQuery.data?.filter(
    (environment) => environment.kind === "candidate",
  );
  const twin = twins?.[twins.length - 1];
  const deploymentsQuery = useDeploymentStepsQuery(twin?.id, isActive);
  const teardownMutation = useTeardownTwinMutation(latestRelease.id);

  const healthChecksPassed = deploymentsQuery.data?.some(
    (step) => step.step === "Run health checks" && step.status === "complete",
  );
  const canBrowse = !!twin?.api_url && !twin.candidate_torn_down && healthChecksPassed;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deployment"
        title={`${twinLabel} deployment`}
        description="Live steps from the twin environment lifecycle."
      />

      {environmentsQuery.isLoading ? (
        <Card className="grid gap-3 p-6">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />
        </Card>
      ) : !twin ? (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            {isActive
              ? `Waiting for the ${twinLabel} to be created...`
              : "No twin deployed yet — click Test Release on the Dashboard to start one."}
          </p>
        </Card>
      ) : (
        <>
          {canBrowse ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div>
                <p className="text-sm font-medium">{twinLabel} is live</p>
                <a
                  href={twin.api_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary underline underline-offset-2"
                >
                  {twin.api_url}
                </a>
                {twin.auto_teardown_at ? (
                  <div className="mt-1">
                    <TeardownCountdown teardownAt={twin.auto_teardown_at} />
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Left running so you can inspect it. Delete it when you&rsquo;re done to stop
                    billing on Zerops.
                  </p>
                )}
              </div>
              <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Delete twin</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete the {twinLabel}?</DialogTitle>
                    <DialogDescription>
                      Permanently deletes the running Zerops service for this twin. The deployment
                      history and test results stay intact &mdash; only the live app is removed.
                      This can&rsquo;t be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      className="bg-block text-block-foreground hover:opacity-90"
                      disabled={teardownMutation.isPending}
                      onClick={() =>
                        teardownMutation.mutate(undefined, {
                          onSuccess: () => setConfirmOpen(false),
                        })
                      }
                    >
                      {teardownMutation.isPending ? "Deleting..." : "Delete twin"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </Card>
          ) : twin.candidate_torn_down ? (
            <Card className="p-6">
              <p className="text-sm text-muted-foreground">
                The {twinLabel}&rsquo;s service has been deleted. The steps below are kept for
                history.
              </p>
            </Card>
          ) : null}

          <Card className="grid gap-3 p-6">
            {deploymentsQuery.isLoading ? (
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </>
            ) : (
              <>
                {deploymentsQuery.data?.map((step) => (
                  <DeploymentStepRow key={step.id} step={step} />
                ))}
                {deploymentsQuery.data?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No steps recorded yet.</p>
                ) : null}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
