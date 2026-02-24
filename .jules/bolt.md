# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-05-15 - Batch Insertion with Pre-calculated UUIDs
**Learning:** Pre-calculating UUIDs client-side (via `uuid.uuid4()`) allows for linking related records across multiple tables (e.g., questions, versions, images) before any records are actually sent to the database. This enables transforming O(N) sequential round-trips into O(1) batch operations per table.
**Action:** Always pre-calculate IDs when inserting entities with one-to-many or many-to-many relationships to enable efficient batching.
