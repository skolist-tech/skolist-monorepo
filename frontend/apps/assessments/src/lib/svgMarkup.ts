const SVG_DOCUMENT = /^\s*<svg\b[\s\S]*<\/svg>\s*$/i;
const UNSAFE_SVG =
  /<\s*(script|foreignObject|iframe|object|embed|link|meta)\b|\son[a-z]+\s*=|javascript\s*:/i;

/** Keep a single SVG document and drop markup that can run script. */
export function sanitizeSvgMarkup(
  code: string | null | undefined
): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed || !SVG_DOCUMENT.test(trimmed) || UNSAFE_SVG.test(trimmed)) {
    return null;
  }
  return trimmed;
}
