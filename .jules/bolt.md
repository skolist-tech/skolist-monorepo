# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-05-14 - [Batch Insertion with Pre-generated UUIDs]
**Learning:** For database schemas with foreign key dependencies, batching insertions across multiple tables is possible by pre-generating primary keys (UUIDs) in the application layer. This allows preparing payloads for all related tables simultaneously and executing them in parallel or sequential batches, reducing round-trip latency from O(N) to O(1) per table.
**Action:** Use `uuid.uuid4()` to pre-calculate IDs for main entities, then link related records in memory before batch-inserting them into Supabase.
