# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---


## 2025-05-14 - Batch Insertion of Generated Questions
**Learning:** Pre-calculating UUIDs in the backend allows for batch-inserting related entities across multiple tables in a single operation, reducing round-trip latency from O(N) to O(1) per table. Sequential inserts in a loop are a major bottleneck when dealing with hierarchies (Questions -> Versions -> Images -> Concepts).
**Action:** Always check if UUIDs can be generated beforehand to enable batching of related records. Use 'extract_version_data' to prepare versioning payloads without waiting for the primary entity's insertion result.
