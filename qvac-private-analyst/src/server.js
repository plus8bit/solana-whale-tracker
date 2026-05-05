import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { getWalletSnapshot } from "./solana-snapshot.js";
import { buildRiskProfile } from "./risk-engine.js";
import { analyzeWithLocalAI, getQvacStatus } from "./qvac-engine.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = normalize(join(__dirname, "..", "public"));
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "127.0.0.1";

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/status") {
      return json(res, {
        ok: true,
        node: process.versions.node,
        qvac: sanitizeQvacStatus(getQvacStatus()),
        privacy: "Wallet snapshots and AI analysis run on this local machine."
      });
    }

    if (req.method === "POST" && url.pathname === "/api/analyze") {
      const body = await readJson(req);
      const snapshot = await getWalletSnapshot(body.address, body.rpcUrl || process.env.SOLANA_RPC_URL);
      const profile = buildRiskProfile(snapshot);
      const analysis = await analyzeWithLocalAI(snapshot, profile);

      return json(res, {
        snapshot,
        profile,
        analysis,
        qvac: sanitizeQvacStatus(analysis.qvac || getQvacStatus())
      });
    }

    if (req.method === "GET") {
      await serveStatic(url.pathname, res);
      return;
    }

    json(res, { error: "Method not allowed" }, 405);
  } catch (error) {
    json(res, { error: error.message }, 500);
  }
});

server.listen(port, host, () => {
  console.log(`Private Whale Analyst running at http://${host}:${port}`);
});

async function readJson(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

async function serveStatic(pathname, res) {
  if (pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }

  const safePath = pathname === "/" ? "/index.html" : pathname;
  const resolved = normalize(join(publicDir, safePath));

  if (!resolved.startsWith(publicDir)) {
    return json(res, { error: "Invalid path" }, 400);
  }

  try {
    const file = await readFile(resolved);
    res.writeHead(200, { "content-type": mimeType(resolved) });
    res.end(file);
  } catch (error) {
    if (error.code === "ENOENT") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    throw error;
  }
}

function json(res, payload, status = 200) {
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function mimeType(path) {
  const ext = extname(path);
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  return "application/octet-stream";
}

function sanitizeQvacStatus(status) {
  return {
    attempted: Boolean(status?.attempted),
    available: Boolean(status?.available),
    error: status?.error || null,
    sdkShape: status?.sdkShape || null,
    modelLoaded: Boolean(status?.modelId)
  };
}
