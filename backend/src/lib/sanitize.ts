import sanitizeHtml from 'sanitize-html';

const decodeEntities = (s: string): string =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&');

/**
 * Strips every HTML tag (and script/style contents). The result is plain text, so the frontend
 * must render it as text and never with dangerouslySetInnerHTML.
 */
export function sanitizeText(input: string): string {
  const stripped = sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(stripped).trim();
}

export function sanitizeDeep(value: unknown): unknown {
  if (typeof value === 'string') return sanitizeText(value);
  if (Array.isArray(value)) return value.map(sanitizeDeep);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, sanitizeDeep(v)]));
  }
  return value;
}
