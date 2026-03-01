## 2025-05-15 - [AI Prompt Input UX]
**Learning:** Character counters and clear buttons are essential for AI prompt textareas to help users manage instruction length and reset states quickly. Proper padding (e.g., `pr-20`) is critical to prevent text overlap with absolute-positioned overlays.
**Action:** Always include `maxLength`, a character counter, and a `type="button"` clear icon for any free-text AI instruction fields. Use `pointer-events-none` on the container to prevent interaction interference while keeping the button `pointer-events-auto`.
