"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DeploymentUpdateStatus } from "@/lib/deployment-update";

import { deployUpdate } from "./deployment-update-action";

const messages: Record<DeploymentUpdateStatus, string> = {
  ready: "Deploys the latest code on the Pi integration branch. Dossier may briefly restart.",
  pending: "Update queued or in progress. This page will reconnect after the restart.",
  updated: "Deployment completed.",
  failed: "Deployment failed. See the Pi update service log for details.",
};

export function DeploymentUpdateCard({ initial }: { initial: DeploymentUpdateStatus }) {
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState(false);
  const [submitting, startTransition] = useTransition();

  useEffect(() => {
    if (status !== "pending") return;

    const controller = new AbortController();
    const interval = window.setInterval(async () => {
      try {
        const response = await fetch("/api/deployment-update", { signal: controller.signal });
        if (!response.ok) return;
        const result: { status: DeploymentUpdateStatus | null } = await response.json();
        if (!controller.signal.aborted && result.status && result.status !== "pending") {
          setStatus(result.status);
          if (result.status === "updated") window.location.reload();
        }
      } catch {
        // The app can be offline briefly while the replacement container starts.
      }
    }, 5000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [status]);

  return (
    <Card padding="none" className="flex flex-wrap items-center justify-between gap-3 px-7 py-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">Deploy Dossier update</span>
        <p role="status" className="text-meta text-muted">
          {error ? "Couldn’t queue an update. Try again." : messages[status]}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        disabled={submitting || status === "pending"}
        onClick={() => {
          setError(false);
          startTransition(async () => {
            try {
              const result = await deployUpdate({});
              if (result.ok) {
                setStatus("pending");
                return;
              }
            } catch {
              // The request may have failed before it reached the server.
            }
            setError(true);
          });
        }}
      >
        Deploy update
      </Button>
    </Card>
  );
}
