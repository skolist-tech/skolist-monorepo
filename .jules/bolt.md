# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2026-03-01 - Batch Inserting Related Entities with Pre-calculated UUIDs
**Learning:** Consolidating database insertions for related entities (e.g., questions, versions, images) from sequential O(N) loops to batch O(1) operations significantly reduces latency. By generating UUIDs in the backend, we can link parent and child records in memory and perform bulk inserts for each table independently.
**Action:** Prioritize backend UUID generation to enable consolidated batching for complex entity graphs, and use `asyncio.gather` for parallelizing secondary table insertions after the primary parent record is persisted.
