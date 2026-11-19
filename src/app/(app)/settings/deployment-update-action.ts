"use server";

import { z } from "zod";

import { action } from "@/lib/action";
import { queueDeploymentUpdate } from "@/lib/deployment-update";

export const deployUpdate = action(z.object({}), queueDeploymentUpdate);
