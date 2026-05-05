# Solana Whale Tracker

Solana Whale Tracker is a Frontier Hackathon project exploring wallet intelligence, liquidity intelligence, and local-first AI analysis for Solana users.

## Live Apps

- Original wallet tracker: https://plus8bit.github.io/solana-whale-tracker/
- LPAgent sidetrack: https://plus8bit.github.io/solana-whale-tracker/lpagent.html

## Tether QVAC Track

### Private Whale Analyst

`qvac-private-analyst/` is a local-first AI extension powered by QVAC.

It fetches public Solana wallet data, builds deterministic risk features, and uses local QVAC inference to summarize whale behavior without sending wallet research to centralized cloud AI APIs.

Run locally:

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

QVAC requires Node.js `>= 22.17.0`.

Production check:

```bash
npm run build
npm run start
```

## Security

- Never commit API keys, private RPC URLs, seed phrases, or local model files.
- The QVAC app does not request wallet signatures.
- Solana RPC responses are treated as untrusted input and compacted before local AI analysis.

## Builder Links

- X/Twitter: https://x.com/plus8bit
- Superteam profile: https://superteam.fun/earn/t/plus8bit
- Colosseum profile: https://arena.colosseum.org/profiles/plus8bit
- Colosseum project: https://arena.colosseum.org/projects/explore/solana-whale-tracker
