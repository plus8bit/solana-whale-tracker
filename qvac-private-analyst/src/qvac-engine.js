import { buildDeterministicAnalysis } from "./risk-engine.js";

let qvacState = {
  attempted: false,
  available: false,
  error: null,
  sdkShape: null,
  modelId: null
};

export async function analyzeWithLocalAI(snapshot, profile) {
  const prompt = buildPrompt(snapshot, profile);

  try {
    const sdk = await loadQvacSdk();
    if (!sdk.available) {
      return {
        ...buildDeterministicAnalysis(snapshot, profile),
        qvac: sdk
      };
    }

    const generated = await runQvacInference(sdk.module, prompt);
    return {
      mode: "qvac-local-inference",
      title: "QVAC Local Wallet Intelligence",
      summary: generated,
      bullets: profile.flags.map((flag) => `${flag.label}: ${flag.detail}`),
      nextActions: [
        "Monitor this wallet locally before converting it into a trading or LP signal.",
        "Compare the next snapshot against this baseline for new tokens, failed transactions, or activity bursts.",
        "Keep wallet data local; do not upload raw behavioral traces to cloud LLM APIs."
      ],
      qvac: sdk
    };
  } catch (error) {
    qvacState = {
      ...qvacState,
      attempted: true,
      available: false,
      error: error.message
    };

    return {
      ...buildDeterministicAnalysis(snapshot, profile),
      qvac: {
        attempted: true,
        available: false,
        error: error.message,
        sdkShape: qvacState.sdkShape
      }
    };
  }
}

export function getQvacStatus() {
  return qvacState;
}

async function loadQvacSdk() {
  if (qvacState.attempted) {
    return qvacState;
  }

  qvacState = { attempted: true, available: false, error: null, sdkShape: null };

  try {
    const module = await import("@qvac/sdk");
    qvacState = {
      attempted: true,
      available: true,
      error: null,
      sdkShape: Object.keys(module).sort(),
      modelId: qvacState.modelId,
      module
    };
  } catch (error) {
    qvacState = {
      attempted: true,
      available: false,
      error: error.message,
      sdkShape: null
    };
  }

  return qvacState;
}

async function runQvacInference(module, prompt) {
  if (
    typeof module.loadModel === "function" &&
    typeof module.completion === "function"
  ) {
    const modelId = await ensureModelLoaded(module);
    const result = module.completion({
      modelId,
      stream: false,
      history: [{ role: "user", content: prompt }]
    });
    return normalizeTextResult(await result.text);
  }

  throw new Error(
    "QVAC SDK is installed, but loadModel()/completion() are not available. Check docs.qvac.tether.io and update qvac-engine.js."
  );
}

async function ensureModelLoaded(module) {
  if (qvacState.modelId) return qvacState.modelId;

  const modelSrc =
    process.env.QVAC_MODEL_SRC ||
    module.LLAMA_3_2_1B_INST_Q4_0 ||
    module.LLAMA_3_2_3B_INST_Q4_0;

  if (!modelSrc) {
    throw new Error("No QVAC LLM model constant found. Set QVAC_MODEL_SRC to a local path, URL, or registry model.");
  }

  qvacState.modelId = await module.loadModel({
    modelSrc,
    modelType: "llm",
    onProgress: (progress) => {
      console.log("QVAC model progress:", progress);
    }
  });

  return qvacState.modelId;
}

function normalizeTextResult(result) {
  if (typeof result === "string") return result.trim();
  if (typeof result?.text === "string") return result.text.trim();
  if (typeof result?.output === "string") return result.output.trim();
  return JSON.stringify(result).slice(0, 1800);
}

function buildPrompt(snapshot, profile) {
  const compactSnapshot = {
    address: snapshot.address,
    capturedAt: snapshot.capturedAt,
    sol: Number(profile.sol.toFixed(6)),
    tokenAccounts: profile.tokenAccounts,
    nonZeroTokenAccounts: profile.nonZeroTokenAccounts,
    recentSignatures: profile.recentSignatures,
    recentFailures: profile.recentFailures,
    newestActivityHoursAgo: profile.newestActivityHoursAgo,
    topTokens: snapshot.tokens.slice(0, 8).map((token) => ({
      mint: token.mint,
      uiAmount: token.uiAmount,
      decimals: token.decimals
    })),
    flags: profile.flags
  };

  return [
    "You are a local, privacy-preserving Solana wallet analyst running on-device with QVAC.",
    "Do not claim price data or identity labels that are not present.",
    "Explain wallet behavior, risk, and next actions in concise product language.",
    "Return 3 short paragraphs: wallet summary, risk notes, and next monitoring actions.",
    "",
    JSON.stringify(compactSnapshot)
  ].join("\n");
}
