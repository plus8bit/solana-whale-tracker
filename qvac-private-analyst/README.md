# Private Whale Analyst

Private Whale Analyst is a local-first AI extension for Solana Whale Tracker, built for the Tether QVAC Frontier Hackathon track.

## Product

The app analyzes public Solana wallet data and generates a private local AI summary with QVAC.

It is designed for users who research whale wallets, token launches, LP flows, and portfolio risk but do not want to send wallet behavior traces to centralized AI APIs.

## Why QVAC

QVAC is used as the local inference layer. The app:

- fetches public Solana wallet data via JSON-RPC
- builds deterministic local risk features
- sends a compact, sanitized wallet snapshot to the local QVAC adapter
- generates a local wallet intelligence summary
- falls back to deterministic local analysis if QVAC is not installed yet

No OpenAI, Anthropic, or other cloud LLM API is used.

## Features

- Solana wallet snapshot from local server-side JSON-RPC calls
- seven-day Solana transaction-history ingestion
- SOL balance, SPL token accounts, recent signatures, parsed transaction programs, token deltas
- local risk score and explainable flags
- QVAC adapter for local wallet summaries
- streaming QVAC inference terminal with model-load and token-generation logs
- deterministic fallback mode if the local model is not available
- Next.js App Router UI with Tailwind CSS and shadcn-style components

## Under the Hood

```txt
Browser UI
  -> POST /api/analyze
  -> lib/solana-pipeline.js
     -> getBalance
     -> getTokenAccountsByOwner
     -> getSignaturesForAddress
     -> getTransaction jsonParsed
  -> compactWalletDataset()
  -> lib/qvac-engine.js
     -> import @qvac/sdk
     -> loadModel()
     -> completion(stream=true)
  -> application/x-ndjson stream
  -> Inference Terminal + Structured Result
```

The browser never calls a cloud LLM endpoint. The only network data source is the configured Solana JSON-RPC endpoint.

## Requirements

QVAC quickstart requires:

- Node.js `>= 22.17.0`
- npm `>= 10.9.0`

Check your runtime:

```bash
npm run check
```

## Setup

```bash
cd qvac-private-analyst
source ~/.nvm/nvm.sh
nvm use 22.17.0
npm install
npm run check
npm run dev
```

Open:

```txt
http://127.0.0.1:8787
```

## Optional RPC

By default, the app uses public Solana mainnet RPC.

You can pass a private endpoint without committing it:

```bash
SOLANA_RPC_URL="https://your-rpc.example" npm run start
```

## Optional QVAC Model Source

By default, the adapter uses QVAC's built-in `LLAMA_3_2_1B_INST_Q4_0` model constant when it is available from `@qvac/sdk`.

You can override it:

```bash
QVAC_MODEL_SRC="/path/to/local/model.gguf" npm run dev
```

This is the recommended demo setup if the first registry download is slow or times out. Download a `llama.cpp`-compatible `.gguf` model once, keep it outside git, and point `QVAC_MODEL_SRC` to the local absolute file path.

For CPU-first local demos:

```bash
QVAC_DEVICE=cpu npm run dev
```

For GPU/Vulkan testing:

```bash
QVAC_DEVICE=gpu npm run dev
```

For fast UI/API smoke tests without loading a model:

```bash
QVAC_DISABLE=1 npm run dev
```

In smoke mode, the app still performs real Solana RPC ingestion and local compaction, then returns a deterministic local heuristic result.

## Security

- Never paste seed phrases.
- The app does not request wallet signatures.
- The app does not send data to cloud AI providers.
- RPC snapshots are treated as untrusted data and compacted before AI analysis.
- RPC endpoint input is optional and is not stored by the app.

## Demo Script

1. Open the local Next.js app.
2. Show the QVAC status pill and dependency path.
3. Analyze an example wallet.
4. Show the terminal logs for RPC ingestion, data compaction, model loading, and token generation.
5. Show the parsed JSON result: risk score, patterns, evidence, monitoring actions.
6. State that the LLM call is local QVAC inference, not a cloud LLM API.

## Submission Links

- Main project: `https://plus8bit.github.io/solana-whale-tracker/`
- GitHub: `https://github.com/plus8bit/solana-whale-tracker`
- Colosseum profile: `https://arena.colosseum.org/profiles/plus8bit`
- Colosseum project: `https://arena.colosseum.org/projects/explore/solana-whale-tracker`
