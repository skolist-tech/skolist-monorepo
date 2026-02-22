# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2026-02-22 - [Batch Insertion with Pre-generated UUIDs]
**Learning:** Pre-calculating UUIDs in the backend (via `uuid.uuid4()`) allows for linking related entities (questions, versions, images) locally and batch-inserting them into multiple tables. This reduces database round-trip latency from $O(N)$ to $O(1)$.
**Action:** Always prefer pre-generating IDs when multiple related tables need to be populated during a single request/operation to enable batching.
