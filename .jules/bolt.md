# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-03-05 - Batch Insertion Architecture
**Learning:** Decoupling AI generation from database persistence allows for consolidated batch insertions, reducing Supabase round-trips from O(N) to O(1) per table. Pre-calculating UUIDs (via `uuid.uuid4()`) is essential for linking related entities (like versions, images, and concept maps) before they are inserted into the database.
**Action:** When optimizing loops with database writes, refactor to collect all data first, pre-generate IDs, and use a single `.insert([...])` call per table. Ensure dependent insertions are conditionally executed only if the primary insertion succeeds.
