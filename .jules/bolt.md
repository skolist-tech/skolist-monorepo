# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-05-14 - Consolidated Batch Insertion Pattern
**Learning:** Sequential database insertions within parallelized async tasks create significant overhead. Decoupling AI generation from DB persistence allows for a single batch insert, which PostgREST/Supabase handles efficiently while returning generated IDs in the same order as the input array.
**Action:** Always refactor loops containing `.insert()` into a two-phase "Collect -> Batch Insert" pattern. Use `asyncio.gather` for related table batch inserts (e.g., versions, images) after the primary entity IDs are retrieved.
