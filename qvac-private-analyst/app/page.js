import { AnalysisWorkbench } from "@/components/analysis-workbench";
import { Badge } from "@/components/ui/badge";

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 terminal-grid opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
      <header className="sticky top-0 z-20 border-b border-emerald-200/10 bg-black/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[conic-gradient(from_180deg,#25e79d,#60d8ff,#ffffff,#25e79d)] text-sm font-black text-emerald-950 shadow-[0_0_40px_rgba(37,231,157,0.22)]">
              PA
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Private Whale Analyst</h1>
              <p className="font-mono text-xs text-emerald-100/55">Solana Whale Tracker x QVAC local AI</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Zero cloud LLM</Badge>
            <Badge variant="outline">Read-only RPC</Badge>
            <Badge>QVAC llama.cpp</Badge>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid max-w-7xl gap-8 px-4 pb-6 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
        <div>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-emerald-300">Sovereign on-chain intelligence</p>
          <h2 className="max-w-4xl text-4xl font-semibold leading-none tracking-tight text-white md:text-6xl">
            Detect whale behavior locally before it becomes a public signal.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-emerald-50/68">
            The pipeline ingests seven days of Solana wallet activity, compacts transaction metadata into a local prompt, and runs QVAC completion on-device to identify wash-trading and sniper-bot patterns without sending research traces to cloud AI providers.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Inference" value="Local" />
          <Stat label="Window" value="7d" />
          <Stat label="Output" value="JSON" />
        </div>
      </section>

      <AnalysisWorkbench />
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
