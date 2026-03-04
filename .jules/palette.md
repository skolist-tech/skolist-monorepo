## 2025-05-14 - Interactive Textarea Enhancements
**Learning:** Adding a character counter and a clear button to a textarea significantly improves the feedback loop for users, especially when there's a hard limit on input length. Using `tabular-nums` prevents jitter during typing, and combining absolute positioning with `pointer-events-none` on the container allows for a seamless UX where controls don't interfere with text selection or scrollbars.
**Action:** Apply the `absolute bottom-2 right-2 flex items-center gap-2` pattern for grouped input controls in textareas across the design system.
