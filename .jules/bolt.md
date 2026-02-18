# Bolt's Performance Journal ⚡

> Only document CRITICAL learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-05-14 - [Batch Insertion with Pre-calculated UUIDs]
**Learning:** Pre-calculating UUIDs in the backend (via `uuid.uuid4()`) for related database entities allows for linking and batch-inserting them across multiple tables in a single operation. This reduces round-trip latency from $O(N)$ (where $N$ is the number of questions) to $O(1)$ for the primary table and its related tables.
**Action:** Always pre-calculate IDs when creating complex entity graphs that need to be persisted to Supabase, enabling the use of `.insert([...])` instead of sequential inserts.

## 2025-05-14 - [Explicit Column Selection for AI Context]
**Learning:** Using `.select("*")` when fetching reference data for AI prompts (like historical questions) increases database retrieval time, network payload size, and AI token consumption. Restricting to specific columns improves latency and reduces costs.
**Action:** Review all Supabase `.select()` calls and replace `*` with explicitly required columns, especially for data being passed to AI models.
