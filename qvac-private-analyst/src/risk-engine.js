export function buildRiskProfile(snapshot) {
  const lamportsPerSol = 1_000_000_000;
  const sol = snapshot.balanceLamports / lamportsPerSol;
  const tokenAccounts = snapshot.tokenAccountCount ?? snapshot.tokens.length;
  const nonZeroTokens = snapshot.tokens.filter((token) => token.uiAmount > 0);
  const signatures = snapshot.signatures.length;
  const recentFailures = snapshot.signatures.filter((sig) => sig.err).length;
  const ageHours = snapshot.newestSignatureBlockTime
    ? Math.max(0, (Date.now() / 1000 - snapshot.newestSignatureBlockTime) / 3600)
    : null;

  const largestToken = nonZeroTokens
    .slice()
    .sort((a, b) => b.uiAmount - a.uiAmount)[0];

  const flags = [];
  let score = 72;

  if (sol > 1_000) {
    score += 8;
    flags.push({
      type: "signal",
      label: "Large SOL balance",
      detail: "The wallet has enough SOL to behave like a meaningful market participant."
    });
  } else if (sol < 0.05) {
    score -= 12;
    flags.push({
      type: "risk",
      label: "Low SOL balance",
      detail: "The wallet may be inactive, drained, or only used as a token holding account."
    });
  }

  if (tokenAccounts > 80) {
    score -= 10;
    flags.push({
      type: "risk",
      label: "High token-account clutter",
      detail: "Many token accounts can indicate airdrop dust, spam exposure, or long-term trading history."
    });
  } else if (tokenAccounts > 15) {
    score += 5;
    flags.push({
      type: "signal",
      label: "Broad token footprint",
      detail: "The wallet touches enough assets to be useful for behavioral analysis."
    });
  }

  if (signatures >= 20 && ageHours !== null && ageHours < 24) {
    score += 8;
    flags.push({
      type: "signal",
      label: "Recently active",
      detail: "Recent signatures suggest the wallet is still relevant for alerts."
    });
  }

  if (recentFailures > 2) {
    score -= 8;
    flags.push({
      type: "risk",
      label: "Failed recent transactions",
      detail: "Multiple failed transactions can indicate bot activity, congestion, or failed strategy execution."
    });
  }

  if (largestToken && largestToken.uiAmount > 1_000_000) {
    flags.push({
      type: "review",
      label: "Large token position",
      detail: `Largest parsed token amount is ${formatNumber(largestToken.uiAmount)} units. Price data is not assumed locally.`
    });
  }

  if (!flags.length) {
    flags.push({
      type: "review",
      label: "Low signal wallet",
      detail: "The wallet has limited activity or holdings in the current RPC snapshot."
    });
  }

  return {
    score: clamp(score, 0, 100),
    sol,
    tokenAccounts,
    nonZeroTokenAccounts: snapshot.nonZeroTokenAccountCount ?? nonZeroTokens.length,
    recentSignatures: signatures,
    recentFailures,
    newestActivityHoursAgo: ageHours,
    largestToken,
    flags
  };
}

export function buildDeterministicAnalysis(snapshot, profile) {
  const riskBand = profile.score >= 75 ? "low operational risk" : profile.score >= 45 ? "medium risk" : "high risk";
  const activity = profile.newestActivityHoursAgo === null
    ? "No recent activity timestamp was returned by RPC."
    : `Newest observed activity is about ${profile.newestActivityHoursAgo.toFixed(1)} hours old.`;

  return {
    mode: "deterministic-fallback",
    title: "Local Wallet Intelligence Summary",
    summary: [
      `This Solana wallet currently scores ${profile.score}/100, which puts it in the ${riskBand} range for monitoring.`,
      `The wallet holds ${profile.sol.toFixed(4)} SOL, has ${profile.tokenAccounts} token accounts, and ${profile.recentSignatures} recent signatures in the local snapshot.`,
      activity
    ].join(" "),
    bullets: profile.flags.map((flag) => `${flag.label}: ${flag.detail}`),
    nextActions: [
      "Track this wallet for balance and token-account changes before treating it as a trading signal.",
      "Review recent signatures manually if the wallet is tied to a token launch, CEX flow, or LP movement.",
      "Avoid sending raw wallet data to cloud LLMs; this app is designed for local analysis with QVAC."
    ]
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}
