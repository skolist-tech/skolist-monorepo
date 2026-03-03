# Palette's UX Journal 🎨

> Only document CRITICAL UX learnings that will help avoid mistakes or make better decisions.
> This is NOT a log of daily work.

---

## 2025-05-15 - Prompt Input Polish
**Learning:** For critical input areas like AI generation prompts, providing immediate feedback (character count) and a quick way to reset (clear button) significantly improves the perceived responsiveness of the form. Using `tabular-nums` prevents the UI from shifting as the user types.
**Action:** Always implement character counters with `tabular-nums` and a conditional `Clear` button (type="button") for significant textareas in the generation flow.
