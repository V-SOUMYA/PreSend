# PreSend: Pause Before You Send

**A kind, on-device nudge that helps kids stop and think before sending a mean or risky message. It never reports to parents.**

## The problem
Kids chat constantly, and one impulsive message (an insult, a home address, a photo sent to a stranger) can cause lasting harm. Most "safety" tools work by monitoring children after the fact and reporting to adults. That can damage trust and doesn't teach judgment.

## Our approach
Intervene at the moment of choice, with respect:
- **Before sending**, check the message **on the device**.
- If it looks hurtful or risky, show a short, friendly nudge explaining *why*.
- The child decides: **reword** or **send anyway**. No one else is told.

## Target users
Children roughly 8-13 using messaging apps, and the parents and educators who want to build digital judgment without surveillance.

## What it detects
| Category | Example | Notes |
|---|---|---|
| Mean messages | "you're such a loser" | Targeted insults, with simple negation handling |
| Self-harm language | "you should go die", "i want to die" | Points to a trusted adult and 988 (US) |
| Secrecy | "don't tell your parents" | Common grooming tactic |
| Meet-up / location | "where do you live" | Stranger context only |
| Alone at home | "my parents are out" | |
| Address / phone / email | "i live at 42 Maple Street" | |
| School | "i go to Lincoln Elementary" | |
| Photos | send a photo to an online-only contact | Stranger context only |
| Sexual content requests | "send nudes" | Always a serious nudge |

A **"Chatting with"** toggle (real-life friend vs. someone met online) raises severity for risky sharing and ignores rules that only make sense for strangers (e.g. "come over").

## Run it
```bash
npm start          # serves http://localhost:8000 (needs python3)
npm test           # evaluate against tests/dataset.json
npm run test:hard  # evaluate against harder, paraphrased cases
```
No dependencies, no build step. `src/detector.js` runs in both the browser and Node.

## Project layout
```
index.html          UI shell
src/detector.js     rule engine (pure function: text + context -> nudge | null)
src/app.js          UI wiring, in-memory stats only
src/style.css       light/dark styles
tests/dataset.json  57 labeled messages
tests/hard-cases.json  paraphrases and tricky cases (expected to fail today)
tests/evaluate.js   precision / recall / category accuracy
```

## Privacy by design
- All checking happens in the browser. **No network requests, no analytics, no cookies, no localStorage.**
- Messages are never stored or logged. Counters exist only in memory and reset on reload.
- **No parent reporting.** This is a deliberate design choice, not a missing feature.

## Evaluation (honest numbers)
| Set | Messages | Precision | Recall |
|---|---|---|---|
| `dataset.json` | 57 | 100% | 100% |
| `hard-cases.json` | 12 | 100% | 9% |

The first set was written alongside the rules, so 100% is optimistic and mostly a regression test. The hard set (paraphrases like "everyone would be happier without you", "what school do you go to?") shows the real weakness: **keyword rules miss meaning**. That gap is the main reason for the roadmap below.

## Limitations and unintended consequences
- **Misses are inevitable.** A child may feel falsely safe because "the app didn't warn me." The UI says it can miss things.
- **False positives cause nudge fatigue** and may teach kids to ignore warnings. We favor targeted rules over broad keyword lists and measure false positives.
- **"Send anyway" is intentional.** We preserve the child's agency. Some kids will click through; that is a tradeoff against surveillance.
- **Evasion:** slang, misspellings and coded language will slip by. Leetspeak is partly handled.
- **Bias and language:** English-only today; slang and dialects differ, and rules may over-flag some communities' speech. Needs testing with diverse users.
- **Not a crisis service.** The self-harm nudge only points toward a trusted adult and 988; it does not replace human help.
- **A tool for kids' own judgment, not a way to monitor them.** We do not recommend deploying it as covert parental monitoring.

## Roadmap
1. Add an optional LLM layer for paraphrase and context detection (documenting exactly what text would leave the device, and keeping rules as the default offline path).
2. Browser extension for web chat.
3. Grow the test set with real teen/parent feedback and multilingual cases.
4. User-test nudge wording with children for tone and comprehension.

## 90-second demo script
1. Friend chat: type a normal message. It sends.
2. Type "you're such a loser". Gentle nudge. Click *Let me reword it*.
3. Switch to "someone I met online". Type "i live at 42 Maple Street". Stronger nudge.
4. Tap 📷. Photo warning.
5. Show the privacy panel and the evaluation table.

## License
MIT
