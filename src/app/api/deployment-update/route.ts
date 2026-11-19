import { getSession } from "@/lib/auth/session";
import { deploymentUpdateStatus } from "@/lib/deployment-update";

export async function GET() {
  if (!(await getSession())) return new Response(null, { status: 401 });
  return Response.json({ status: await deploymentUpdateStatus() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
