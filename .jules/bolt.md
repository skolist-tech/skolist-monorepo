# Bolt's Journal - Performance Learnings

## 2025-05-14 - Batching and Threading in QGen
**Learning:** The question generation process had a significant N+1 bottleneck where questions, versions, images, and concept mappings were inserted one by one in a loop using a synchronous Supabase client. This not only caused high latency due to multiple round-trips but also blocked the FastAPI event loop for each call.
**Action:** Implemented batch insertions for all related tables and wrapped all synchronous database calls in `asyncio.to_thread`. This allows multiple batches to progress in parallel while waiting for database I/O, significantly improving overall throughput.
