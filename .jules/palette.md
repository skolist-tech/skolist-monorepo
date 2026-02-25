# Palette's UX Journal

## 2025-05-15 - [Refining Input Overlays]
**Learning:** When adding absolute-positioned elements like clear buttons or character counters inside a textarea or input, it's critical to add sufficient padding (e.g., `pr-10`) to the input itself. Without this, user-typed text will eventually slide under the controls, creating a cluttered and unreadable experience.
**Action:** Always pair absolute-positioned input overlays with corresponding padding on the input element.

## 2025-05-15 - [Mobile-First Hover states]
**Learning:** Hover states (using `group-hover`) are invisible on mobile devices. If an action (like "Clear") is only visible on hover, it becomes inaccessible to touch users.
**Action:** Use `md:opacity-0` combined with `group-hover:opacity-100` but keep `opacity-100` as default for small screens to ensure buttons are always visible on mobile/touch devices.
