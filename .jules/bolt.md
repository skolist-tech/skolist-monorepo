# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2026-02-21 - Batching Question Creation
**Learning:** The question generation flow involves multiple related tables (gen_questions, gen_question_versions, gen_images, gen_questions_concepts_maps). Sequential inserts within a loop created a significant O(N) bottleneck.
**Action:** Pre-calculate UUIDs on the backend to allow batch inserting (O(1)) into all related tables while maintaining correct foreign key relationships without waiting for database-generated IDs.
