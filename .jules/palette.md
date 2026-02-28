## 2025-05-15 - Interactive Prompt Box Enhancements
**Learning:** Character counters and clear buttons inside textareas improve input management but require careful padding (e.g., `pr-10 pb-8`) to avoid overlapping text. Hover-to-reveal patterns for controls like 'Clear' buttons should be disabled on mobile/touch devices to ensure they remain accessible.
**Action:** Use `opacity-100 md:opacity-0 md:group-hover:opacity-100` for optional input controls and always provide sufficient right/bottom padding when overlays are present.
