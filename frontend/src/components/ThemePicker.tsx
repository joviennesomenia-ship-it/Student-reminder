import { useEffect, useRef, useState } from 'react';
import { PRESETS, useThemeStore } from '@/store/theme';
import { contrastRatio, hexToRgbChannels } from '@/utils/color';
import { Button } from './ui/Button';

const SWATCH: Record<string, [string, string]> = {
  classic: ['#1d4ed8', '#b91c1c'],
  ocean: ['#0369a1', '#0f766e'],
  forest: ['#15803d', '#a16207'],
  sunset: ['#c2410c', '#be123c'],
  purple: ['#6d28d9', '#a21caf'],
  graphite: ['#374151', '#dc2626'],
  dark: ['#60a5fa', '#f87171'],
};

export function ThemePicker({ onInk = false }: { onInk?: boolean }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const { preset, primaryHex, accentHex, setPreset, setCustom } = useThemeStore();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const low = (hex: string): boolean => contrastRatio(hexToRgbChannels(hex), '255 255 255') < 4.5 && preset === 'custom';

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme colors"
        aria-expanded={open}
        className={`rounded-lg px-2.5 py-1 text-lg ${onInk ? 'hover:bg-white/15' : 'hover:bg-surface-2'}`}
      >
        🎨
      </button>
      {open && (
        <div role="dialog" aria-label="Theme colors" className="absolute right-0 top-full z-50 mt-2 text-fg w-72 rounded-xl2 border border-border bg-surface p-4 shadow-card">
          <p className="mb-3 text-sm font-bold">🎨 Themes</p>
          <p className="mb-3 text-xs text-muted">Only changes how the site looks on your device.</p>
          <ul className="space-y-1">
            {PRESETS.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setPreset(p.id)}
                  aria-pressed={preset === p.id}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm font-medium hover:bg-surface-2 ${
                    preset === p.id ? 'bg-surface-2 ring-1 ring-primary' : ''
                  }`}
                >
                  <span className="flex">
                    <span className="h-5 w-5 rounded-full border border-border" style={{ background: SWATCH[p.id]?.[0] }} />
                    <span className="-ml-1.5 h-5 w-5 rounded-full border border-border" style={{ background: SWATCH[p.id]?.[1] }} />
                  </span>
                  {p.label}
                  {preset === p.id && <span className="ml-auto" aria-hidden="true">✓</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-sm font-bold">Custom colors</p>
            <div className="flex gap-3">
              <label className="flex-1 text-xs font-semibold">
                Main
                <input
                  type="color"
                  value={primaryHex}
                  onChange={(e) => setCustom(e.target.value, accentHex)}
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-border"
                />
              </label>
              <label className="flex-1 text-xs font-semibold">
                Accent
                <input
                  type="color"
                  value={accentHex}
                  onChange={(e) => setCustom(primaryHex, e.target.value)}
                  className="mt-1 h-9 w-full cursor-pointer rounded border border-border"
                />
              </label>
            </div>
            {(low(primaryHex) || low(accentHex)) && (
              <p className="mt-2 text-xs font-medium text-accent" role="status">
                That color is light, so text in it may be hard to read. Try a darker shade.
              </p>
            )}
            <Button small variant="ghost" className="mt-2" onClick={() => setPreset('classic')}>
              Reset to default
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
