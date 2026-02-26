# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-03-05 - Consolidating Batch Insertions across AI Generation Batches
**Learning:** Even when individual AI generation batches are small (e.g., 3 questions), performing database insertions sequentially for each batch creates a significant overhead of O(N) round-trips. By separating the generation and insertion phases, we can parallelize the generation across all batches and then consolidate all generated questions into a single O(1) batch insertion for the entire request.
**Action:** Always pre-calculate UUIDs in the backend when dealing with related entities to decouple their insertion logic and enable massive batching across multiple tables in parallel.
