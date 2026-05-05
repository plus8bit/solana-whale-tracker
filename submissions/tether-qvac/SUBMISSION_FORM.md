# Tether QVAC Submission Form

## Project Title

```txt
Private Whale Analyst
```

## Project Description

```txt
Private Whale Analyst is a local-first AI extension for Solana Whale Tracker.

It fetches seven days of public Solana wallet data via JSON-RPC, converts the raw wallet trace into a compact local text format, and uses QVAC as the local inference layer to summarize whale behavior, token-account risk, activity patterns, spam exposure, and next monitoring actions.

The core value is privacy: wallet research and behavioral analysis can happen locally on the user's device instead of being sent to centralized cloud AI APIs. The UI streams RPC ingestion logs, QVAC model-load progress, token generation, and parsed JSON output so judges can verify that QVAC is a functional part of the product flow.
```

## Project Github Link

```txt
https://github.com/plus8bit/solana-whale-tracker
```

## Project Website

For this track, use the GitHub repo plus demo video because QVAC runs locally:

```txt
https://github.com/plus8bit/solana-whale-tracker/tree/main/qvac-private-analyst
```

## Colosseum Project

```txt
https://arena.colosseum.org/projects/explore/solana-whale-tracker
```

## Colosseum Profile

```txt
https://arena.colosseum.org/profiles/plus8bit
```

## Demo Video

Paste YouTube unlisted or Loom link after recording.

## Anything Else

```txt
Private Whale Analyst runs as a local Node app because QVAC is a local/on-device AI SDK. The app has a QVAC adapter and a deterministic fallback mode so reviewers can still test the wallet pipeline before downloading a local model.

Under the hood: POST /api/analyze -> Solana RPC getBalance/getTokenAccountsByOwner/getSignaturesForAddress/getTransaction -> compactWalletDataset -> @qvac/sdk loadModel -> completion(stream=true) -> NDJSON stream to the inference terminal.

No cloud LLM API is used. No seed phrases or wallet signatures are requested. Solana RPC data is treated as untrusted input and compacted before local AI analysis.
```
