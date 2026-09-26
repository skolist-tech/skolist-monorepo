# Student assessment e2e

Parent: [../TESTING.md](../TESTING.md).

| File | What it covers |
| --- | --- |
| `student.spec.ts` | Assigned list shows published seeds, not draft or closed. Student 3 sees **No attempt yet** and **View attempts**. Student 1 opens a live NEET paper from the attempts list (instructions, palette, Save & Next). |
| `workflow.spec.ts` | Student 3 starts NEET Open, answers, Save & Next, then jumps back to question 1 from the palette. |
| `attempt-authored-paper.spec.ts` | Teacher 2 authors, assigns Student 3, and publishes. Student 3 sits the paper, submits, sees 8/8, and goes **Back**. Teacher reviews the graded attempt and goes **Back**. |
| `unreleased-paper.spec.ts` | Student 3 does not see a draft they were assigned, a published paper that was never assigned, or a paper after the teacher closes it. |
| `review-flags.spec.ts` | After submit, correct answers stay hidden. Once the teacher closes the paper and turns on review and answer flags, the student sees it under past tests and can open the correct answers. |
| `explanation-figure.spec.ts` | During the attempt and on the hidden result, the explanation text and figure are absent. After the teacher reveals answers, the result shows both. |
| `jee-main-complete-attempt.spec.ts` | Student 2 sits JEE Main Mock Test 1 end to end. Physics Q1 shows the inline stem SVG and option badge SVGs. |
