# LPAgent.io API Integrate Sidetrack Submission

## Project

**LP Whale Signal Agent** is an LP intelligence extension for Solana Whale Tracker.

Live demo after deploy:

`https://plus8bit.github.io/solana-whale-tracker/lpagent.html`

Original project:

`https://plus8bit.github.io/solana-whale-tracker/`

## One-liner

An agent that discovers high-signal Meteora pools with LPAgent.io, ranks them by opportunity/risk, previews a Zap-In transaction, then identifies top LP wallets to monitor with Solana Whale Tracker.

## Why this fits LPAgent

LPAgent is focused on AI-powered liquidity management for Meteora on Solana. This project uses LPAgent's API as the core data source for:

- pool discovery via `/pools/discover`
- pool opportunity ranking using TVL, 24h volume, organic score, volatility, and fee/TVL
- top LP wallet discovery via `/pools/{poolId}/top-lpers`
- Zap-In transaction planning via `/pools/{poolId}/add-tx`
- LP wallet follow-up through the existing Solana Whale Tracker workflow

## What is built

- `lpagent.html`: standalone static demo that can be deployed on GitHub Pages.
- Live LPAgent API mode with `x-api-key` input.
- Demo mode for judges who do not want to paste a key during the first review.
- Pool ranking dashboard.
- Agent summary explaining the best pool, top LP wallet, and next action.
- Zap-In Transaction Planner that previews an LPAgent Zap-In workflow without signing or broadcasting transactions.
- Submission docs, demo script, and deployment checklist.

## User

The target user is a Solana trader, LP manager, or founder who wants to answer:

- Which Meteora pools are worth monitoring today?
- Which pools have good activity but acceptable risk?
- Which LP wallets appear skilled enough to watch?
- What should I investigate next before opening an LP position?

## Current API integration

The prototype calls:

```txt
GET https://api.lpagent.io/open-api/v1/pools/discover
GET https://api.lpagent.io/open-api/v1/pools/{poolId}/top-lpers
POST https://api.lpagent.io/open-api/v1/pools/{poolId}/add-tx
```

Authentication:

```txt
x-api-key: <LPAGENT_API_KEY>
```

Note: `top-lpers` and Zap-In may require Premium or Enterprise API access. The app handles that by keeping demo mode available for reviewers and by clearly explaining when live premium access is needed.

## Judging narrative

Most wallet trackers stop at balances. LP Whale Signal Agent connects wallet intelligence to liquidity behavior. It starts from LPAgent's best liquidity data, finds promising pools, ranks opportunity and risk, then converts the best LP owners into whale-wallet watchlist targets.

This creates a practical loop:

1. Discover profitable LP opportunities.
2. Preview a Zap-In transaction before any signing.
3. Identify the LP wallets with good historical behavior.
4. Track those wallets across the broader Solana ecosystem.
5. Use the signals for alerts, research, and future automated LP actions.

## Roadmap

Next 48 hours:

- Add saved watchlists for pools and LP wallets.
- Add Telegram alerts for score changes and new top LPers.
- Add a small backend proxy so the LPAgent API key is not exposed in the browser.

Next 1-2 weeks:

- Add wallet connect.
- Add per-user alert rules.
- Add LP position health summaries.
- Add recommended zap-in/zap-out intent previews, with no transaction signing without explicit user confirmation.

## Submission links

- GitHub: `https://github.com/plus8bit/solana-whale-tracker`
- Demo: `https://plus8bit.github.io/solana-whale-tracker/lpagent.html`
- X/Twitter: `https://x.com/plus8bit`
- Builder profile: `https://superteam.fun/earn/t/plus8bit`
