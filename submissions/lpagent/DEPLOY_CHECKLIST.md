# LPAgent Deploy Checklist

## 1. Add files to GitHub

From the repo folder:

```bash
git status
git add lpagent.html submissions/lpagent
git commit -m "Add LPAgent whale signal agent submission"
git push origin main
```

## 2. Confirm GitHub Pages URL

Open:

```txt
https://plus8bit.github.io/solana-whale-tracker/lpagent.html
```

Check:

- page loads on mobile and desktop
- demo data loads automatically
- API key input exists
- Zap-In Transaction Planner exists
- "Run LP Signal Scan" works with your LPAgent key
- "Generate Zap-In Preview" explains demo mode without signing transactions
- no private API key is committed to GitHub

## 3. Record video

Use `DEMO_SCRIPT.md`.

Recommended structure:

- 10 seconds: problem and product name
- 45 seconds: demo page walkthrough
- 20 seconds: explain LPAgent API usage
- 10 seconds: roadmap and close

Upload to YouTube as unlisted.

## 4. Superteam submission text

Use this short version:

```txt
LP Whale Signal Agent extends my Solana Whale Tracker with LPAgent.io liquidity intelligence.

It uses LPAgent pool discovery to rank Meteora pools by fee opportunity, volume, TVL, organic score, and risk. For the best pool, it includes a Zap-In Transaction Planner using LPAgent's Zap-In workflow, then checks top LPers and turns those LP owners into wallet watchlist targets for deeper Solana whale tracking.

The result is a practical agent workflow: discover strong pools, preview Zap-In actions, identify skilled LP wallets, and know what to monitor next.

Demo: https://plus8bit.github.io/solana-whale-tracker/lpagent.html
GitHub: https://github.com/plus8bit/solana-whale-tracker
```

## 5. Links to submit

- Demo URL
- GitHub URL
- YouTube unlisted video
- X post URL if you make one

## 6. Optional X post

```txt
I shipped LP Whale Signal Agent for the @LPAgent_io Frontier sidetrack.

It extends my Solana Whale Tracker with LPAgent pool discovery + Zap-In planning + top LP wallet intelligence:
- ranks Meteora pools by opportunity/risk
- previews LPAgent Zap-In actions
- identifies LP wallets worth watching
- bridges LP data into whale tracking

Demo: https://plus8bit.github.io/solana-whale-tracker/lpagent.html
```
