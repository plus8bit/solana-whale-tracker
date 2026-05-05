import { getQvacStatus } from "@/lib/qvac-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    node: process.versions.node,
    qvac: getQvacStatus(),
    privacy: {
      cloudLlm: false,
      walletSigning: false,
      dataBoundary: "local-nextjs-server"
    }
  });
}
