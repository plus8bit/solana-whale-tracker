const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";

export async function getWalletSnapshot(address, rpcUrl = process.env.SOLANA_RPC_URL || DEFAULT_RPC) {
  assertSolanaAddress(address);

  const [balance, tokenAccounts, signatures] = await Promise.all([
    rpc(rpcUrl, "getBalance", [address, { commitment: "confirmed" }]),
    rpc(rpcUrl, "getTokenAccountsByOwner", [
      address,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed", commitment: "confirmed" }
    ]),
    rpc(rpcUrl, "getSignaturesForAddress", [address, { limit: 30 }])
  ]);

  const allTokens = (tokenAccounts.value || [])
    .map((account) => {
      const info = account.account?.data?.parsed?.info;
      const amount = info?.tokenAmount;
      return {
        account: account.pubkey,
        mint: info?.mint,
        owner: info?.owner,
        uiAmount: Number(amount?.uiAmount || 0),
        decimals: Number(amount?.decimals || 0),
        rawAmount: amount?.amount || "0"
      };
    })
    .filter((token) => token.mint)
    .sort((a, b) => b.uiAmount - a.uiAmount);

  const newestSignatureBlockTime = signatures.find((sig) => sig.blockTime)?.blockTime || null;
  const nonZeroTokenAccountCount = allTokens.filter((token) => token.uiAmount > 0).length;

  return {
    address,
    rpcUrl: redactRpcUrl(rpcUrl),
    capturedAt: new Date().toISOString(),
    balanceLamports: balance.value || 0,
    tokenAccountCount: allTokens.length,
    nonZeroTokenAccountCount,
    tokens: allTokens.slice(0, 80),
    signatures: signatures.map((sig) => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime,
      err: sig.err,
      memo: sig.memo
    })),
    newestSignatureBlockTime
  };
}

async function rpc(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(`${method} failed with HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`${method} failed: ${json.error.message || "RPC error"}`);
  }
  return json.result;
}

function assertSolanaAddress(address) {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new Error("Enter a valid Solana wallet address.");
  }
}

function redactRpcUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname ? "/..." : ""}`;
  } catch {
    return "custom-rpc";
  }
}
