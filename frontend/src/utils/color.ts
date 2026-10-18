/** "#1d4ed8" -> "29 78 216" (the channel format used by the CSS variables). */
export function hexToRgbChannels(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m || !m[1]) return '29 78 216';
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function luminance(channels: string): number {
  const [r = 0, g = 0, b = 0] = channels.split(' ').map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks white or near-black text for a given background channel string. */
export function readableOn(channels: string): string {
  return contrastRatio(channels, '255 255 255') >= contrastRatio(channels, '15 23 42')
    ? '255 255 255'
    : '15 23 42';
}
