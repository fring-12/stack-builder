# StackBuilder — Content Module 01: Caching

*Topic design doc. This is the teaching content first; the game wiring comes after. Every future topic should follow this same template.*

---

## The one thing they should learn

> **A cache trades freshness for speed.** Putting a fast copy of data in front of a slow store absorbs repeated reads — but only if the data is read far more often than it changes, and only if you have an answer for what happens when the copy goes stale or disappears.

If a player finishes this module and internalises that single sentence — *caching is a trade, not a free win* — the module succeeded. Everything below exists to earn that sentence through experience rather than assertion.

---

## Why caching is the right first lesson

It is the most common real-world scalability fix, it stands alone (you don't need queues, replicas, or sharding to understand it), and it has the cleanest "aha": the player watches their database die, adds one brick, and watches it survive. Then — crucially — we take the win away twice to show that naive caching has sharp edges. That arc (easy win → hidden cost → judgment) is the shape of every good lesson.

---

## Components this module uses

| Brick | Role in this topic |
|---|---|
| Users | Traffic source (already in game) |
| App Server | Runs your code; decides what to cache (already in game) |
| Database | Slow source of truth (already in game) |
| Cache | The fast copy in front of the DB (already in game) |

No new *bricks* are required. What's new is the **rules the Cache is judged by** — see "New mechanics the engine needs" at the end. The current engine only checks "is a Cache present and connected?" That's enough for Scenario 1 but not for 2–4, which is exactly why those scenarios teach more.

---

## The scenarios

Four scenarios, rising difficulty. Each isolates one facet. Each has a precise pass/fail rule and a plain-English explanation on both outcomes.

---

### Scenario 1 — "Read Storm" (the basic win)

**Setup shown to player:** *"Your feed is a hit. The same popular posts get read tens of thousands of times a second. Your database is doing the same expensive query over and over and starting to choke."*

**Traffic:** 25,000 reads/sec, 95% of them for the same small set of "hot" items.

**Pass rule (engine):** a Cache is present and sits on the read path between App Server and Database (`App Server → Cache`, with the DB behind it).

**Fail rule:** no cache on the read path — every read hits the DB.

**On pass:**
> *"The cache now answers the repeated reads from memory. 95% of requests never touch the database — that's your **cache hit ratio**. The database went from 25,000 queries/sec to about 1,200. You didn't make the database faster; you stopped asking it the same question."*

**On fail:**
> *"Every read is hitting the database directly, including the same popular post 20,000 times a second. The database can't keep up and requests start timing out. The fix isn't a bigger database — it's to stop asking it the same question repeatedly. Put a Cache on the read path."*

**Facet taught:** what a cache *is* and why hit ratio is the whole game.

---

### Scenario 2 — "Stale Prices" (the first hidden cost)

**Setup:** *"You cached everything forever and it's blazing fast. But you just ran a flash sale — and customers are still seeing yesterday's prices. Some are checking out at the wrong price."*

**Traffic:** normal, but the underlying data **changes** during the wave.

**Pass rule (engine):** the Cache has a **TTL / invalidation policy** set (a new property on the cache brick — see mechanics), *or* the player routes price-critical reads past the cache to the DB.

**Fail rule:** cache with no expiry on data that changed → players are served stale values.

**On pass:**
> *"By giving cached prices a short time-to-live (TTL), the cache refreshes them from the database every few seconds. You accept data that's a few seconds old in exchange for speed — a deliberate trade. For things that must be exact (payment totals), you read straight from the source."*

**On fail:**
> *"Your cache is serving a snapshot from before the sale started, and nothing told it to update. This is **cache invalidation** — the hardest part of caching. A cache with no expiry and no invalidation will happily serve wrong data forever. Set a TTL, or invalidate the entry when the price changes."*

**Facet taught:** a cache is a *copy*, and copies go out of date. Freshness is the price you pay for speed.

**Design note:** this is the module's turning point — the moment "cache = free win" breaks. Make the failure *visceral*: show a customer checking out at the old price.

---

### Scenario 3 — "The Stampede" (the sharp edge)

**Setup:** *"Everything's been smooth for hours. Then, at the top of the minute, your most popular cached item expires — and 10,000 requests that would have hit the cache all slam the database in the same instant."*

**Traffic:** steady and fine, then a single synchronized cache-miss spike.

**Pass rule (engine):** player adds a mitigation — any one of: **request coalescing** ("only let one request rebuild the cache, others wait"), **staggered/jittered TTLs**, or **cache warming / don't-expire-hot-keys**. (Represented as a toggle/upgrade on the cache brick — see mechanics.)

**Fail rule:** plain cache with a single hard expiry on a hot key.

**On pass:**
> *"Now when the entry expires, only the first request rebuilds it from the database while everyone else waits for that one result — or the hot keys never expire all at once because their TTLs are jittered. The database sees one query instead of ten thousand. You've smoothed the cliff edge."*

**On fail:**
> *"This is a **cache stampede** (or 'thundering herd'). The cache was protecting the database so well that the database had no spare capacity — so the instant the cache blinked, the full, un-absorbed load hit it at once and it fell over. Caching doesn't just reduce load; it *hides* how much load is really there. Mitigate the miss: coalesce requests, or stagger your TTLs."*

**Facet taught:** a cache changes the *shape* of failure. The better it works, the more dangerous a miss becomes. This is the insight that separates people who've *used* caches from people who *understand* them.

---

### Scenario 4 — "Don't Cache This" (the over-engineering trap)

**Setup:** *"A teammate suggests caching the user's live account balance and their real-time notification count to 'make everything faster.' Should you?"*

**Traffic:** data that changes on almost every read; each item read by only one user.

**Pass rule (engine):** player **does NOT** cache the always-changing, per-user data (leaves those reads going to the DB/source), and spends their budget elsewhere. Adding a cache here *fails* or scores worse.

**Fail rule:** player caches it anyway → the scenario reports near-zero hit ratio, added complexity, and new staleness bugs for no gain.

**On pass:**
> *"Correct — you left it alone. Caching only helps when data is read far more often than it changes and shared across many requests. A live balance that changes every read, seen by one person, has almost no cache hits — you'd pay all the cost of caching (staleness, invalidation, memory, a stampede surface) and get almost none of the benefit. Knowing when *not* to cache is senior-level judgment."*

**On fail:**
> *"You cached data that changes on nearly every read and is only ever seen by one user. Your hit ratio is ~3% — the cache is almost never right, so almost every request still hits the database AND now risks showing a stale balance. You added complexity and a new class of bugs for no speed gain. Not everything should be cached."*

**Facet taught:** judgment. The anti-pattern. This scenario is what makes the module *teach engineering* rather than *teach "add cache = good."*

---

## End-of-module recap (one screen)

Shown after all four pass. Three takeaways, phrased to stick:

1. **A cache is a bet that data is read more than it's written.** When that's true, it's the highest-leverage fix you have. When it's false, it's pure downside.
2. **The hard part isn't adding the cache — it's invalidation.** Every cached value needs an answer to "how does this get updated or expire?" A cache with no invalidation story is a stale-data bug waiting to happen.
3. **A cache hides load, so a cache miss is dangerous.** Design for the moment the cache *isn't* there: stagger expiries, coalesce rebuilds, and never let your database depend on 100% cache uptime.

> **The sentence to remember:** *Caching trades freshness for speed — it's a deliberate trade, not a free win.*

---

## New mechanics the engine needs (minimal, buildable step by step)

The current engine checks only *presence + reachability*. To teach Scenarios 2–4, the Cache brick needs a little more state. Each of these is a small, self-contained task — build them in order and you unlock one scenario at a time:

1. **Read-path awareness** — the engine must distinguish "cache is on the read path between App and DB" from "cache is just connected somewhere." Needed for Scenario 1 to be accurate. *(Small change to the graph check: is there a path App → Cache → DB?)*

2. **A `policy` property on the Cache brick** — e.g. `none | ttl | invalidate`, set by clicking the brick. Scenario 2 checks it. *(Adds a tiny config popover to a brick — first time bricks have editable settings. Reusable for every future topic.)*

3. **A `missProtection` toggle on the Cache** — `off | coalescing | jittered-ttl`. Scenario 3 checks it. *(Same popover, one more field.)*

4. **Per-scenario "data profile"** — each scenario declares whether its data is *read-heavy & shared* (cache helps) or *write-heavy & per-user* (cache hurts), and the engine scores the player's caching decision against it. Scenario 4 needs this. *(This is the most important new primitive — it's what lets the engine reward judgment instead of just checking for boxes, and it generalises to every topic after caching.)*

Notice the ramp: Scenario 1 needs almost nothing new, and each later scenario adds exactly one small primitive. That's your step-by-step build order for this module — and primitives #2 and #4 are the foundation the *entire* platform will reuse.

---

## What to build first (next concrete task)

Implement mechanic #1 (read-path awareness) and ship **Scenario 1 with its two explanations**. That's a self-contained, playable, genuinely instructive slice — the smallest complete piece of the Caching module. Everything else layers on top one primitive at a time.
