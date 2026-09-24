# Teacher assessment e2e

Parent: [../TESTING.md](../TESTING.md).

| File | What it covers |
| --- | --- |
| `teacher.spec.ts` | Teacher 1 sees seed papers, including draft and closed. Opens the draft JEE Advanced editor. Opens a live NEET paper and sees attempts. **Open** on a draft goes to the editor; **Back** returns to the list. |
| `workflow.spec.ts` | Teacher 2 creates a draft, adds and edits a question, assigns Student 3, publishes, and closes a paper. Delete confirm: Cancel keeps the paper, Delete removes it. |
| `author-and-publish.spec.ts` | Teacher 2 creates a draft, adds a section and two MCQs, edits stems, options, and keys, and publishes. |
