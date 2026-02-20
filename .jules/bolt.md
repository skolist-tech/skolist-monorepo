# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2026-02-20 - [Batch Question Insertion Optimization]
**Learning:** Pre-calculating UUIDs in the backend allows for batching inserts across multiple related tables (gen_questions, gen_question_versions, gen_images, gen_questions_concepts_maps) in a single set of parallel round-trips, reducing latency from O(N) to O(1) relative to the number of questions.
**Action:** Always prefer pre-generating IDs for complex entity relationships to enable efficient bulk database operations.
