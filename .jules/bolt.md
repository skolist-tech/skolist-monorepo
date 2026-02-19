# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2026-02-19 - Batching Supabase Inserts
**Learning:** Sequential database inserts in a loop (O(N)) are a major bottleneck for question generation. Batching inserts reduces round-trips to O(1) per table. Using `asyncio.gather` for secondary tables (versions, images, concepts) further parallelizes the work.
**Action:** Always look for O(N) database patterns in loops and refactor them into batch operations using `.insert([...])` and `asyncio.gather`.
