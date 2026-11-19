import "server-only";

import { mkdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const directory = process.env.DOSSIER_UPDATE_DIR;

export type DeploymentUpdateStatus = "ready" | "pending" | "updated" | "failed";

export async function deploymentUpdateStatus(): Promise<DeploymentUpdateStatus | null> {
  if (!directory) return null;

  if (await stat(join(directory, "request")).then(() => true, () => false)) return "pending";
  const status = (await readFile(join(directory, "status"), "utf8").catch(() => "")).trim();
  if (status === "ready" || status === "updated" || status === "failed") return status;
  return null;
}

export async function queueDeploymentUpdate(): Promise<void> {
  if (!directory || !(await deploymentUpdateStatus())) throw new Error("Deployment worker unavailable");

  try {
    await mkdir(join(directory, "request"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
}
