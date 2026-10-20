# StackBuilder — Project Brief & Working Agreement

You are helping me build **StackBuilder**, a browser-based game that teaches software engineers system design by letting them *build* an architecture out of LEGO-style bricks and then stress-testing it against waves of real-world traffic and edge cases. Read this whole brief before writing any code. It captures my vision, the decisions I've already made, and exactly where to start.

---

## The vision (long-term — do NOT try to build all of this at once)

A playground where an engineer designs a system block by block — APIs, databases, caching, devops, frontend structure — and the platform throws thousands of realistic scenarios at the design and shows what breaks and why. After enough scenarios pass, the engineer has real confidence the design holds up. It's two products in one: a **design sandbox** and a **learning platform** that teaches by doing instead of by lecture (people forget lectures; they remember things they built). Eventually: accounts, progress tracking, a guided curriculum, and a subscription tier for structured learning paths and interview prep.

## The decisions I've already made (respect these)

1. **Content-first, one topic at a time.** The engine is the easy 20%; the hard, valuable 80% is authoring accurate scenarios and explanations. We build ONE topic to excellence, then the next. Do not sprawl across APIs + DB + devops + frontend at once. Current focus lane: **backend scalability**.
2. **Rules/heuristics engine, NOT a real distributed-systems simulator.** We encode the canonical tradeoffs experts already know. We never claim to simulate a user's real system — we stress-test a design against the mistakes that bite real systems. Accuracy of the *mental model* matters; physical fidelity does not.
3. **Teaching lives in the explanations.** Every scenario outcome (pass AND fail) must explain *why*. The puzzle creates the experience; the text creates the understanding.
4. **Judgment over "add more boxes."** Scenarios must include over-engineering traps where the correct answer is to NOT add a component. This is what makes it teach engineering instead of "cache = good."
5. **Small, self-contained tasks.** Each change should be a shippable, playable slice.
6. **Free playground first; monetization later.** Don't build accounts/billing yet.

---

## Current state of the code

- **`stackbuilder.html`** — the entire MVP, a single self-contained file (inline CSS/JS, no build step, no dependencies). Open it directly in a browser; no server or port needed.
- **`docs-caching-module.md`** — the first fully-authored content module (Caching). This is the spec for what to build next. Read it carefully.

### How the current game works
- **Project select screen** → pick a project (PhotoShare / QuickCart / StreamBox; currently cosmetic — they share rules).
- **Canvas**: drag component bricks from a palette; a fixed **Users** brick is always present. Connect bricks by dragging from a white "nub"; delete via an ✕. Connections are drawn as SVG wires.
- **Components**: Users, Load Balancer, App Server, Cache, Database, Read Replica, CDN, Message Queue, Object Storage. Each is a styled 3D-ish brick.
- **Simulation**: "Start" runs 6 escalating waves (50 → 5k → 25k → 100k → 250k → 1,000,000 users). Each wave animates traffic, then passes (green glow) or fails (red glow + a fix hint).
- **The rules engine** (`SCENARIOS` array + `buildGraph()`): the graph is validated by **BFS reachability from the Users node**, so disconnected bricks don't count. Each scenario is `{wave, title, users, desc, check(g)}` where `g` exposes `linked(type)` and `count(type)`. This is the core abstraction — extend it, don't replace it.
- The sim panel is draggable + minimizable so the board stays editable mid-run; "Retry Wave" re-tests the same design after edits.

### Known constraints / notes
- Single-file architecture is intentional for now (easy to share/run). If you propose splitting into modules or adding a build step, ASK FIRST and justify it — simplicity and zero-setup are features at this stage.
- No framework. Vanilla JS. Keep it that way unless we explicitly decide otherwise.

---

## What to build next (START HERE)

Implement the Caching module from `docs-caching-module.md`, in the order its "New mechanics the engine needs" section lays out. The mechanics are designed so each scenario unlocks with ONE small new primitive. Do the first slice only, then stop and let me play it:

**First task — smallest complete slice:**
1. Add **read-path awareness** to the engine: distinguish "a Cache sits on the read path between App Server and the Database (`App → Cache → DB`)" from "a Cache is merely connected somewhere." (A targeted graph check, not a rewrite.)
2. Ship **Caching Scenario 1 ("Read Storm")** with BOTH its pass and fail explanations, using the exact copy and rules in the doc.
3. Make it playable end to end, then pause for my review.

After that, we'll add the next primitives one at a time:
- an editable **`policy` property** on the Cache brick (`none | ttl | invalidate`) → unlocks Scenario 2 (Stale Prices). This introduces clickable per-brick settings — a foundation the whole platform reuses.
- a **`missProtection`** toggle (`off | coalescing | jittered-ttl`) → unlocks Scenario 3 (The Stampede).
- a per-scenario **data profile** (read-heavy&shared vs write-heavy&per-user) that the engine scores caching decisions against → unlocks Scenario 4 (the over-engineering trap). This is the most important new primitive; it's what lets the engine reward judgment.

---

## How I want you to work

- Confirm you've read `docs-caching-module.md` and `stackbuilder.html` before coding.
- Build the first slice only; don't run ahead to later scenarios.
- Preserve the single-file, no-build, vanilla-JS approach unless we agree to change it.
- Keep the `SCENARIOS` + `buildGraph()` rules-engine pattern; extend `g` with new helpers as needed.
- When you finish a slice, tell me exactly what to click to test it, and what the pass/fail copy should read.
- Write the scenario explanation text to match the doc's voice: plain English, teaches the *why*, never condescending.

Start by reading the two files, then propose your plan for the first slice.
