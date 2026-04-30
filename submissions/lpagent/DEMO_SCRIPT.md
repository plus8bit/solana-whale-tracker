# Demo Video Script

Target length: 75-100 seconds.

## Opening

Hi, I am Nick, plus8bit. I built Solana Whale Tracker for the Frontier Hackathon, and for the LPAgent.io sidetrack I extended it into LP Whale Signal Agent.

The problem is simple: liquidity providers and traders do not just need a list of pools. They need to know which pools are worth watching, which LP wallets are actually good, and what to investigate next.

## Product Walkthrough

This page uses LPAgent.io as the core data source.

First, I can paste an LPAgent API key and run a Solana Meteora pool scan. The app calls the LPAgent pool discovery endpoint, filters by organic score, and ranks pools by fee opportunity, TVL, 24-hour volume, and risk.

Here the agent identifies the best pool to monitor. Instead of only showing raw data, it turns the data into a decision: this pool has strong activity, acceptable organic score, and enough liquidity to deserve deeper research.

Then the agent checks top LPers for the selected pool. These LP wallets become watchlist targets. The important part is the bridge with my existing Solana Whale Tracker: once we find a strong LP wallet, we can track its broader Solana portfolio and behavior.

## Why LPAgent

LPAgent gives the app the liquidity intelligence layer: pool discovery, LP position data, and top LP ranking. My project adds the whale-tracking and alerting layer on top.

## Close

The next version adds Telegram alerts and a small backend proxy so the API key stays private. The goal is to make LPAgent data actionable for traders, LP managers, and Solana founders who need fast liquidity intelligence.

Thank you for reviewing my submission.
