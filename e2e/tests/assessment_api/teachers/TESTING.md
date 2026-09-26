# Teacher assessment e2e

Parent: [../TESTING.md](../TESTING.md).

| File | What it covers |
| --- | --- |
| `teacher.spec.ts` | Teacher 1 sees only papers they can access, including the draft. Opens the draft editor and a live NEET paper. **Open** on a draft goes to the editor; **Back** returns to the list. Teacher 2 opens the closed paper. |
| `workflow.spec.ts` | The worker's e2e teacher clones a blueprint, edits a question, assigns that worker's e2e student, publishes, and closes a paper. Delete confirm: Cancel keeps the paper, Delete removes it. |
| `author-and-publish.spec.ts` | The worker's e2e teacher clones a blueprint, edits two MCQs in the paper view, and publishes. |
| `paper-view.spec.ts` | **Open question paper** shows the student attempt layout with **Edit** on the question, each option, and the explanation. Cancel discards an edit. A stem image uploads, survives reload, and is removed with the cross. An explanation and its figure save, survive reload, and the figure can be removed while the text stays. Changing the correct option persists. |
| `blueprint-flow.spec.ts` | Header shows name, organisation, and log out. Chapter Wise stays disabled. Full Syllabus lists the seeded blueprint. Another teacher's paper is hidden. Seed group can be assigned and deassigned. |
