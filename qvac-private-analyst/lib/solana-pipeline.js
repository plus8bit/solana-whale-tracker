const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const LAMPORTS_PER_SOL = 1_000_000_000;

export async function buildWalletDataset({ address, rpcUrl, days = 7, emit = () => {} }) {
  assertSolanaAddress(address);
  const endpoint = rpcUrl || DEFAULT_RPC;
  const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  emit({ type: "log", level: "info", message: "rpc.fetch.balance_and_token_accounts.start" });
  const [balance, tokenAccounts, signatures] = await Promise.all([
    rpc(endpoint, "getBalance", [address, { commitment: "confirmed" }]),
    rpc(endpoint, "getTokenAccountsByOwner", [
      address,
      { programId: TOKEN_PROGRAM },
      { encoding: "jsonParsed", commitment: "confirmed" }
    ]),
    fetchSignatures(endpoint, address, cutoff, emit)
  ]);

  const recentSignatures = signatures.filter((item) => !item.blockTime || item.blockTime >= cutoff);
  emit({ type: "log", level: "info", message: `rpc.fetch.signatures.count=${recentSignatures.length}` });

  const parsedTransactions = await fetchParsedTransactions(
    endpoint,
    recentSignatures.slice(0, Number(process.env.MAX_PARSED_TX || 48)).map((item) => item.signature),
    emit
  );

  const tokenSummary = normalizeTokenAccounts(tokenAccounts.value || []);
  const transactions = parsedTransactions
    .map((tx, index) => summarizeParsedTransaction(tx, recentSignatures[index], address))
    .filter(Boolean);

  const profile = buildHeuristicProfile({
    address,
    balanceLamports: balance.value || 0,
    tokenSummary,
    signatures: recentSignatures,
    transactions
  });

  return {
    address,
    capturedAt: new Date().toISOString(),
    windowDays: days,
    rpc: redactRpcUrl(endpoint),
    balanceLamports: balance.value || 0,
    tokenSummary,
    signatures: recentSignatures,
    transactions,
    profile,
    publicView: {
      address,
      rpc: redactRpcUrl(endpoint),
      sol: Number(((balance.value || 0) / LAMPORTS_PER_SOL).toFixed(6)),
      tokenAccountCount: tokenSummary.total,
      nonZeroTokenAccountCount: tokenSummary.nonZero,
      signatureCount7d: recentSignatures.length,
      parsedTransactionCount: transactions.length,
      topTokens: tokenSummary.tokens.slice(0, 12)
    }
  };
}

export function compactWalletDataset(dataset) {
  const lines = [
    `wallet=${dataset.address}`,
    `capturedAt=${dataset.capturedAt}`,
    `windowDays=${dataset.windowDays}`,
    `sol=${(dataset.balanceLamports / LAMPORTS_PER_SOL).toFixed(6)}`,
    `tokenAccounts=${dataset.tokenSummary.total}`,
    `nonZeroTokenAccounts=${dataset.tokenSummary.nonZero}`,
    `signatures7d=${dataset.signatures.length}`,
    `parsedTx=${dataset.transactions.length}`,
    `heuristicScore=${dataset.profile.score}`,
    `heuristicFlags=${dataset.profile.flags.map((flag) => `${flag.kind}:${flag.label}`).join(",")}`
  ];

  for (const tx of dataset.transactions.slice(0, 48)) {
    lines.push([
      "tx",
      `t=${tx.isoTime || "unknown"}`,
      `slot=${tx.slot}`,
      `ok=${tx.ok}`,
      `fee=${tx.feeSol}`,
      `walletSolDelta=${tx.walletSolDelta}`,
      `programs=${tx.programs.join("+") || "none"}`,
      `signers=${tx.signers.slice(0, 4).join("+") || "none"}`,
      `deltas=${tx.tokenDeltas.map((delta) => `${delta.mint}:${delta.owner || "na"}:${delta.delta}`).join("+") || "none"}`
    ].join("|"));
  }

  return lines.join("\n");
}

async function fetchSignatures(endpoint, address, cutoff, emit) {
  const signatures = [];
  let before;

  for (let page = 0; page < 5; page += 1) {
    const batch = await rpc(endpoint, "getSignaturesForAddress", [
      address,
      { limit: 100, ...(before ? { before } : {}) }
    ]);

    signatures.push(...batch);
    emit({ type: "log", level: "info", message: `rpc.getSignaturesForAddress.page=${page + 1} batch=${batch.length}` });

    if (batch.length < 100) break;
    before = batch[batch.length - 1].signature;

    const oldest = batch.findLast((item) => item.blockTime)?.blockTime;
    if (oldest && oldest < cutoff) break;
  }

  return signatures;
}

async function fetchParsedTransactions(endpoint, signatures, emit) {
  const results = [];

  for (let i = 0; i < signatures.length; i += 6) {
    const chunk = signatures.slice(i, i + 6);
    const txs = await Promise.all(
      chunk.map((signature) => rpc(endpoint, "getTransaction", [
        signature,
        {
          commitment: "confirmed",
          encoding: "jsonParsed",
          maxSupportedTransactionVersion: 0
        }
      ]).catch((error) => ({
        __error: error.message,
        signature
      })))
    );
    results.push(...txs);
    emit({ type: "log", level: "info", message: `rpc.getTransaction.batch=${Math.floor(i / 6) + 1} tx=${txs.filter((tx) => tx && !tx.__error).length}` });
  }

  return results;
}

function normalizeTokenAccounts(accounts) {
  const tokens = accounts
    .map((account) => {
      const info = account.account?.data?.parsed?.info;
      const amount = info?.tokenAmount;
      return {
        account: account.pubkey,
        mint: info?.mint,
        owner: info?.owner,
        amount: Number(amount?.uiAmount || 0),
        decimals: Number(amount?.decimals || 0)
      };
    })
    .filter((token) => token.mint)
    .sort((a, b) => b.amount - a.amount);

  return {
    total: tokens.length,
    nonZero: tokens.filter((token) => token.amount > 0).length,
    tokens: tokens.slice(0, 80)
  };
}

function summarizeParsedTransaction(tx, signatureMeta, wallet) {
  if (!tx || tx.__error) return null;

  const message = tx.transaction?.message;
  const meta = tx.meta;
  const accountKeys = (message?.accountKeys || []).map((key) => ({
    pubkey: key.pubkey?.toString?.() || key.pubkey || key.toString?.() || String(key),
    signer: Boolean(key.signer)
  }));

  const walletIndex = accountKeys.findIndex((key) => key.pubkey === wallet);
  const walletSolDelta = walletIndex >= 0
    ? ((meta?.postBalances?.[walletIndex] || 0) - (meta?.preBalances?.[walletIndex] || 0)) / LAMPORTS_PER_SOL
    : 0;

  return {
    signature: signatureMeta?.signature || tx.transaction?.signatures?.[0] || "",
    slot: tx.slot,
    blockTime: tx.blockTime || signatureMeta?.blockTime || null,
    isoTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null,
    ok: !meta?.err,
    err: meta?.err || null,
    feeSol: Number(((meta?.fee || 0) / LAMPORTS_PER_SOL).toFixed(9)),
    walletSolDelta: Number(walletSolDelta.toFixed(9)),
    programs: [...new Set((message?.instructions || []).map((ix) => ix.program || ix.programId?.toString?.()).filter(Boolean))].slice(0, 10),
    signers: accountKeys.filter((key) => key.signer).map((key) => key.pubkey).slice(0, 8),
    tokenDeltas: summarizeTokenDeltas(meta).slice(0, 8)
  };
}

function summarizeTokenDeltas(meta) {
  const before = new Map();
  for (const item of meta?.preTokenBalances || []) {
    before.set(`${item.accountIndex}:${item.mint}:${item.owner || ""}`, Number(item.uiTokenAmount?.uiAmount || 0));
  }

  const deltas = [];
  for (const item of meta?.postTokenBalances || []) {
    const key = `${item.accountIndex}:${item.mint}:${item.owner || ""}`;
    const pre = before.get(key) || 0;
    const post = Number(item.uiTokenAmount?.uiAmount || 0);
    const delta = post - pre;
    if (Math.abs(delta) > 0) {
      deltas.push({
        mint: item.mint,
        owner: item.owner,
        delta: Number(delta.toFixed(6))
      });
    }
  }
  return deltas;
}

function buildHeuristicProfile({ balanceLamports, tokenSummary, signatures, transactions }) {
  const failures = signatures.filter((item) => item.err).length;
  const failedRate = signatures.length ? failures / signatures.length : 0;
  const programCounts = countPrograms(transactions);
  const flags = [];
  let score = 65;

  if (balanceLamports / LAMPORTS_PER_SOL > 1000) {
    score += 10;
    flags.push({ kind: "signal", label: "large_sol_balance", detail: "Wallet holds more than 1,000 SOL." });
  }

  if (tokenSummary.total > 80) {
    score -= 8;
    flags.push({ kind: "risk", label: "token_account_clutter", detail: "High token-account count can indicate spam exposure or high-frequency trading history." });
  }

  if (failedRate > 0.2) {
    score -= 12;
    flags.push({ kind: "risk", label: "failed_transaction_cluster", detail: "Recent failed transaction ratio is above 20%." });
  }

  if (signatures.length > 80) {
    score -= 6;
    flags.push({ kind: "review", label: "high_activity_density", detail: "Seven-day activity density is high enough to review for bot behavior." });
  }

  const frequentPrograms = Object.entries(programCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([program, count]) => `${program}:${count}`);

  if (frequentPrograms.length) {
    flags.push({ kind: "signal", label: "program_footprint", detail: frequentPrograms.join(", ") });
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    failedRate: Number(failedRate.toFixed(3)),
    flags,
    programCounts
  };
}

function countPrograms(transactions) {
  const counts = {};
  for (const tx of transactions) {
    for (const program of tx.programs) {
      counts[program] = (counts[program] || 0) + 1;
    }
  }
  return counts;
}

async function rpc(endpoint, method, params) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params })
  });

  if (!response.ok) throw new Error(`${method} failed with HTTP ${response.status}`);

  const json = await response.json();
  if (json.error) throw new Error(`${method} failed: ${json.error.message || "RPC error"}`);
  return json.result;
}

function assertSolanaAddress(address) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address || "")) {
    throw new Error("Invalid Solana wallet address.");
  }
}

function redactRpcUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/...`;
  } catch {
    return "custom-rpc";
  }
}
