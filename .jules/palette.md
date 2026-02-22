## 2024-05-22 - [PromptBox Polish & Component Consistency]
**Learning:** Consistently using shared UI components (like `@skolist/ui`'s `Textarea`) ensures that micro-UX features like character counters and clear buttons align with the existing design system. Subtle overlays for counters (absolute positioned with `bg-background/80`) provide helpful feedback without distracting from the main input task.
**Action:** Always check `@skolist/ui` for high-level components before using native HTML elements, and apply standard tactile feedback (`active:scale-95`) to all primary action buttons.
