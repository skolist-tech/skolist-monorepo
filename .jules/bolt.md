# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---


## 2026-02-17 - [Optimized Question Generation Persistence]
**Learning:** Sequential database insertions in a loop for related tables (questions -> versions -> images -> concepts) created a major latency bottleneck ( \times 4$ round trips). Pre-calculating UUIDs in Python allows for batching all related data and inserting them in a constant number of round trips (4), regardless of question count.
**Action:** Always pre-calculate IDs when inserting parent-child relationships in batches to avoid O(N) round-trip overhead.
