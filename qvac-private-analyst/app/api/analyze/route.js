import { buildWalletDataset, compactWalletDataset } from "@/lib/solana-pipeline";
import { runLocalInference } from "@/lib/qvac-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request) {
  const body = await request.json();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        controller.enqueue(encoder.encode(`${JSON.stringify({ ts: new Date().toISOString(), ...event })}\n`));
      };

      try {
        send({ type: "log", level: "info", message: "analysis.request.accepted" });
        send({ type: "log", level: "info", message: "rpc.window=7d mode=read_only cluster=mainnet-beta" });

        const dataset = await buildWalletDataset({
          address: body.address,
          rpcUrl: body.rpcUrl || process.env.SOLANA_RPC_URL,
          days: 7,
          emit: send
        });

        send({
          type: "snapshot",
          dataset: dataset.publicView,
          profile: dataset.profile
        });

        const compactText = compactWalletDataset(dataset);
        send({
          type: "log",
          level: "info",
          message: `transform.compact_bytes=${Buffer.byteLength(compactText, "utf8")} tx_rows=${dataset.transactions.length}`
        });

        const analysis = await runLocalInference({
          compactText,
          profile: dataset.profile,
          emit: send
        });

        send({ type: "analysis", analysis });
        send({ type: "done" });
      } catch (error) {
        send({ type: "error", message: error.message });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
