# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-05-15 - Batch Database Insertions for QGen
**Learning:** Performing sequential database inserts for related entities (questions, versions, images, concepts) creates an O(N) round-trip bottleneck. Pre-calculating UUIDs in Python allows for linking these entities offline and performing O(1) bulk insertions per table.
**Action:** Always decouple AI generation/data preparation from database persistence to enable consolidated batch operations and minimize network latency.
