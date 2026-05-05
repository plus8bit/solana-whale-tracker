let qvacState = {
  sdkLoaded: false,
  llamaCppPackage: false,
  modelLoaded: false,
  modelId: null,
  modelSrc: null,
  lastError: null
};

const LOCAL_MODEL_TYPE = "llamacpp-completion";

export function getQvacStatus() {
  return {
    ...qvacState,
    modelId: qvacState.modelId ? `${qvacState.modelId.slice(0, 6)}...` : null
  };
}

export async function runLocalInference({ compactText, profile, emit }) {
  const systemPrompt = [
    "You are Private Whale Analyst, a local QVAC on-chain risk analyst.",
    "You analyze public Solana wallet activity from a compact seven-day JSON-RPC snapshot.",
    "Do not invent prices, identities, labels, or counterparties not present in the data.",
    "Detect possible wash trading, sniper-bot behavior, failed execution clusters, token-account spam, and wallet-monitoring actions.",
    "Return JSON only with keys: riskScore, verdict, patterns, evidence, monitoringActions.",
    "patterns must be an array of {name, severity, explanation}. evidence must be an array of short strings."
  ].join(" ");

  const userPrompt = [
    "Analyze this compact Solana wallet dataset.",
    "Use the deterministic heuristic profile as a prior, then reason from transaction rows.",
    `heuristicProfile=${JSON.stringify(profile)}`,
    "compactDataset:",
    compactText
  ].join("\n");

  try {
    if (process.env.QVAC_DISABLE === "1") throw new Error("QVAC_DISABLE=1");

    emit({ type: "log", level: "info", message: "qvac.sdk.import.start" });
    const qvac = await import("@qvac/sdk");
    qvacState.sdkLoaded = true;
    qvacState.llamaCppPackage = true;
    emit({ type: "log", level: "info", message: `qvac.sdk.import.ok llama_cpp_package=${qvacState.llamaCppPackage}` });

    const modelId = await ensureModelLoaded(qvac, emit);
    emit({ type: "log", level: "info", message: `qvac.completion.start model=${shortId(modelId)}` });

    let text = "";
    let stats;

    try {
      const result = qvac.completion({
        modelId,
        stream: true,
        history: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        generationParams: {
          temp: 0.15,
          top_p: 0.85,
          predict: Number(process.env.QVAC_COMPLETION_PREDICT || process.env.QVAC_PREDICT || 700)
        }
      });

      for await (const token of result.tokenStream) {
        text += token;
        emit({ type: "token", token });
      }

      stats = await result.stats;
      emit({ type: "log", level: "info", message: `qvac.completion.done tokens=${text.length} stats=${Boolean(stats)}` });
    } catch (error) {
      const message = formatQvacError(error);
      emit({ type: "log", level: "error", message: `QVAC completion failed: ${message}` });
      throw new Error(message);
    }

    return normalizeAnalysis(text, profile, "qvac-local-inference", stats);
  } catch (error) {
    const message = formatQvacError(error);
    qvacState.lastError = message;
    emit({ type: "log", level: "warn", message: `qvac.fallback.reason=${message}` });
    return deterministicAnalysis(profile);
  }
}

async function ensureModelLoaded(qvac, emit) {
  if (qvacState.modelId) return qvacState.modelId;

  const modelSrc = resolveModelSrc(qvac);
  if (!modelSrc) throw new Error("No QVAC model source available. Set QVAC_MODEL_SRC.");

  const modelSourceKind = process.env.QVAC_MODEL_SRC ? "filesystem" : "registry";
  qvacState.modelSrc = typeof modelSrc === "string" ? modelSrc : modelSrc.name || modelSrc.src || "registry-model";
  emit({ type: "log", level: "info", message: `qvac.loadModel.start source=${modelSourceKind} modelSrc=${qvacState.modelSrc}` });

  try {
    qvacState.modelId = await qvac.loadModel({
      modelSrc,
      modelType: process.env.QVAC_MODEL_TYPE || LOCAL_MODEL_TYPE,
      modelConfig: compactObject({
        device: process.env.QVAC_DEVICE || "cpu",
        ctx_size: Number(process.env.QVAC_CTX_SIZE || 4096),
        predict: Number(process.env.QVAC_PREDICT || 700),
        verbosity: qvac.VERBOSITY?.ERROR
      }),
      onProgress: (progress) => {
        emit({ type: "model-progress", progress: sanitizeProgress(progress) });
      }
    });
  } catch (error) {
    const message = formatQvacError(error);
    qvacState.lastError = message;
    emit({ type: "log", level: "error", message: `QVAC SDK init failed: ${message}` });
    throw new Error(message);
  }

  qvacState.modelLoaded = true;
  emit({ type: "log", level: "info", message: `qvac.loadModel.done modelId=${shortId(qvacState.modelId)}` });
  return qvacState.modelId;
}

function resolveModelSrc(qvac) {
  const localPath = process.env.QVAC_MODEL_SRC?.trim();
  if (localPath) {
    return localPath;
  }

  return qvac.LLAMA_3_2_1B_INST_Q4_0;
}

function normalizeAnalysis(text, profile, mode, stats) {
  const parsed = parseJsonObject(text);
  if (!parsed) {
    return {
      ...deterministicAnalysis(profile),
      mode,
      rawText: text.slice(0, 2400),
      parseWarning: "Model output was not valid JSON; deterministic analysis was used for structured fields.",
      stats
    };
  }

  return {
    mode,
    riskScore: clampNumber(parsed.riskScore, 0, 100, profile.score),
    verdict: String(parsed.verdict || "Local analysis completed."),
    patterns: Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 8) : [],
    evidence: Array.isArray(parsed.evidence) ? parsed.evidence.slice(0, 10) : [],
    monitoringActions: Array.isArray(parsed.monitoringActions) ? parsed.monitoringActions.slice(0, 8) : [],
    stats
  };
}

function deterministicAnalysis(profile) {
  return {
    mode: "deterministic-fallback",
    riskScore: profile.score,
    verdict: "QVAC inference was unavailable, so the app returned a deterministic local heuristic analysis.",
    patterns: profile.flags.map((flag) => ({
      name: flag.label,
      severity: flag.kind === "risk" ? "medium" : "informational",
      explanation: flag.detail
    })),
    evidence: [
      `failedRate=${profile.failedRate}`,
      `programs=${Object.entries(profile.programCounts || {}).slice(0, 5).map(([k, v]) => `${k}:${v}`).join(",") || "none"}`
    ],
    monitoringActions: [
      "Re-run analysis with QVAC model loaded for semantic pattern classification.",
      "Track repeated program usage and failed transaction clusters over the next 24 hours.",
      "Do not export compact wallet traces to cloud LLM APIs."
    ]
  };
}

function parseJsonObject(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return null;

  try {
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    return null;
  }
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && item !== "")
  );
}

function formatQvacError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  const normalized = raw.replace(/\s+/g, " ").trim();

  if (normalized.includes("generationParams") && normalized.includes("temperature")) {
    return "QVAC completion schema rejected generationParams.temperature; use generationParams.temp.";
  }

  if (
    normalized.includes("modelRegistryGetModel") &&
    normalized.includes("registryPath") &&
    normalized.includes("registrySource")
  ) {
    return "QVAC RPC schema rejected the request payload. Local GGUF models must be passed as modelSrc filesystem path strings, not registry descriptor objects.";
  }

  return normalized.length > 320 ? `${normalized.slice(0, 320)}...` : normalized;
}

function sanitizeProgress(progress) {
  if (!progress || typeof progress !== "object") return { raw: String(progress) };
  return {
    stage: progress.stage || progress.type || "model",
    percentage: typeof progress.percentage === "number" ? Number(progress.percentage.toFixed(2)) : undefined,
    downloaded: progress.downloaded,
    total: progress.total,
    message: progress.message
  };
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function shortId(value) {
  return value ? `${String(value).slice(0, 6)}...` : "n/a";
}
