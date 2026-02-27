# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2026-02-27 - [Batch Insertion Optimization]
**Learning:** Pre-calculating UUIDs in the backend (via `uuid.uuid4()`) for related database entities allows for linking and batch-inserting them across multiple tables in a single operation. This reduces database round-trip latency from O(N) to O(1) per table.
**Action:** Use `uuid.uuid4()` to generate IDs for parent entities before batch insertion to link child entities in memory.

## 2026-02-27 - [Parallelizing IO-bound Operations]
**Learning:** Parallelizing independent IO-bound operations (like credit checks and metadata fetching) using `asyncio.gather` significantly reduces the total blocking time of an API request.
**Action:** Identify independent database or API calls in the request lifecycle and parallelize them.
