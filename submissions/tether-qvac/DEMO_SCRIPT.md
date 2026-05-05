# Demo Video Script

Target length: 90 seconds.

## Opening

Hi, I am Nick, plus8bit. I built Solana Whale Tracker for the Frontier Hackathon. For the Tether QVAC track, I extended it into Private Whale Analyst.

The problem is that wallet research can be sensitive. Traders and builders often paste wallet behavior into cloud AI tools, which leaks research patterns and alpha.

## Product

Private Whale Analyst runs locally. It fetches public Solana wallet data, builds a local risk profile, and uses QVAC as the local AI layer to explain whale behavior.

Here I enter a Solana wallet. The local Next.js API reads SOL balance, token accounts, recent signatures, and parsed transactions from Solana JSON-RPC. Then it compacts the seven-day trace into a small text payload for the local model context.

The terminal shows the pipeline under the hood: RPC requests, compacted byte size, QVAC model loading, and streamed token generation. With QVAC, the wallet intelligence summary is generated locally on the user's machine, without OpenAI, Anthropic, or any centralized cloud AI API.

## QVAC Fit

QVAC is not a wrapper here. The app calls `loadModel()` and `completion(stream=true)` as the core analysis step after Solana data compaction. The model returns structured JSON: risk score, verdict, detected patterns, evidence, and monitoring actions.

## Close

The next version adds watchlists, local embeddings for wallet history, and private alerts. Thank you for reviewing my submission.
