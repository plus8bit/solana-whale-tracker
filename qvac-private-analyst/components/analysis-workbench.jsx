"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, BrainCircuit, LockKeyhole, Radar, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EXAMPLE_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

export function AnalysisWorkbench() {
  const [address, setAddress] = useState(EXAMPLE_WALLET);
  const [rpcUrl, setRpcUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [terminal, setTerminal] = useState([]);
  const [tokenText, setTokenText] = useState("");
  const [snapshot, setSnapshot] = useState(null);
  const [profile, setProfile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [status, setStatus] = useState(null);
  const terminalRef = useRef(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then(setStatus)
      .catch(() => setStatus({ ok: false }));
  }, []);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [terminal, tokenText]);

  async function analyze() {
    setRunning(true);
    setTerminal([{ level: "info", message: "client.stream.open" }]);
    setTokenText("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, rpcUrl })
      });

      if (!response.body) throw new Error("No response stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          handleEvent(JSON.parse(line));
        }
      }
    } catch (error) {
      pushTerminal("error", error.message);
    } finally {
      setRunning(false);
      pushTerminal("info", "client.stream.closed");
    }
  }

  function handleEvent(event) {
    if (event.type === "log") pushTerminal(event.level, event.message);
    if (event.type === "model-progress") pushTerminal("model", formatProgress(event.progress));
    if (event.type === "token") setTokenText((current) => current + event.token);
    if (event.type === "snapshot") {
      setSnapshot(event.dataset);
      setProfile(event.profile);
      pushTerminal("info", `snapshot.ready signatures=${event.dataset.signatureCount7d} parsed=${event.dataset.parsedTransactionCount}`);
    }
    if (event.type === "analysis") {
      setAnalysis(event.analysis);
      pushTerminal("info", `analysis.ready mode=${event.analysis.mode}`);
    }
    if (event.type === "error") pushTerminal("error", event.message);
    if (event.type === "done") pushTerminal("info", "pipeline.done");
  }

  function pushTerminal(level, message) {
    setTerminal((current) => [...current.slice(-220), { ts: new Date().toLocaleTimeString(), level, message }]);
  }

  const metrics = useMemo(() => [
    { label: "Risk score", value: analysis?.riskScore ?? profile?.score ?? "--", icon: Radar },
    { label: "7d signatures", value: snapshot?.signatureCount7d ?? "--", icon: Activity },
    { label: "Parsed tx", value: snapshot?.parsedTransactionCount ?? "--", icon: TerminalSquare },
    { label: "AI mode", value: analysis?.mode?.replaceAll("-", " ") || "idle", icon: BrainCircuit }
  ], [analysis, profile, snapshot]);

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-10">
      <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Local Analysis Control</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Solana wallet address</Label>
              <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rpc">Optional Solana RPC endpoint</Label>
              <Input id="rpc" type="password" value={rpcUrl} onChange={(event) => setRpcUrl(event.target.value)} placeholder="Leave empty for public mainnet RPC" />
            </div>
            <div className="grid grid-cols-[1fr_118px] gap-2">
              <Button onClick={analyze} disabled={running}>{running ? "Running..." : "Analyze Locally"}</Button>
              <Button variant="outline" onClick={() => setAddress(EXAMPLE_WALLET)} disabled={running}>Example</Button>
            </div>
            <div className="rounded-lg border border-emerald-200/10 bg-black/25 p-3 text-sm leading-6 text-emerald-50/64">
              <div className="mb-2 flex items-center gap-2 text-emerald-200"><LockKeyhole className="h-4 w-4" /> Data boundary</div>
              Browser sends wallet address to the local Next.js API. The API performs read-only Solana RPC calls and calls QVAC locally. No cloud LLM endpoint is configured.
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Node {status?.node || "checking"}</Badge>
              <Badge variant={status?.qvac?.modelLoaded ? "default" : "outline"}>{status?.qvac?.modelLoaded ? "model loaded" : "model lazy-load"}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Card key={metric.label} className="p-4">
                  <Icon className="mb-3 h-4 w-4 text-emerald-300" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/45">{metric.label}</p>
                  <p className="mt-2 truncate text-2xl font-semibold text-white">{metric.value}</p>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Inference Terminal</CardTitle>
                <Badge>{running ? "streaming" : "idle"}</Badge>
              </CardHeader>
              <CardContent>
                <div ref={terminalRef} className="h-[430px] overflow-auto rounded-lg border border-emerald-200/10 bg-black/55 p-3 font-mono text-xs leading-6">
                  {terminal.map((line, index) => (
                    <div key={`${line.ts}-${index}`} className={line.level === "error" ? "text-red-300" : line.level === "warn" ? "text-yellow-200" : line.level === "model" ? "text-cyan-200" : "text-emerald-100/72"}>
                      <span className="text-emerald-100/35">{line.ts}</span> [{line.level}] {line.message}
                    </div>
                  ))}
                  {tokenText ? (
                    <pre className="mt-3 whitespace-pre-wrap border-t border-emerald-200/10 pt-3 text-emerald-100">{tokenText}</pre>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Structured Result</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/45">Verdict</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-50/78">{analysis?.verdict || "Run analysis to generate a local verdict."}</p>
                </div>
                <div className="space-y-2">
                  {(analysis?.patterns || []).map((pattern, index) => (
                    <div key={`${pattern.name}-${index}`} className="rounded-lg border border-emerald-200/10 bg-white/[0.03] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{pattern.name}</p>
                        <Badge variant="outline">{pattern.severity || "review"}</Badge>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-emerald-50/60">{pattern.explanation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>On-chain Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              {snapshot ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <Snapshot label="SOL balance" value={snapshot.sol} />
                  <Snapshot label="Token accounts" value={`${snapshot.nonZeroTokenAccountCount}/${snapshot.tokenAccountCount}`} />
                  <Snapshot label="RPC" value={snapshot.rpc} />
                </div>
              ) : (
                <p className="text-sm text-emerald-50/55">No wallet snapshot loaded.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Snapshot({ label, value }) {
  return (
    <div className="rounded-lg border border-emerald-200/10 bg-black/20 p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-100/40">{label}</p>
      <p className="mt-2 truncate font-mono text-sm text-emerald-100">{String(value)}</p>
    </div>
  );
}

function formatProgress(progress) {
  if (!progress) return "qvac.model.progress";
  const pct = progress.percentage !== undefined ? ` percentage=${progress.percentage}` : "";
  const stage = progress.stage || "model";
  const bytes = progress.downloaded && progress.total ? ` bytes=${progress.downloaded}/${progress.total}` : "";
  return `qvac.loadModel.${stage}${pct}${bytes}`;
}
