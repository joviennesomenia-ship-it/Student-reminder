import { create } from 'zustand';
import { hexToRgbChannels, readableOn } from '@/utils/color';

export type PresetId = 'classic' | 'ocean' | 'forest' | 'sunset' | 'purple' | 'graphite' | 'dark';
export type ThemeId = PresetId | 'custom';

export const PRESETS: { id: PresetId; label: string }[] = [
  { id: 'classic', label: 'Classic Red-White-Blue' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'forest', label: 'Forest' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'purple', label: 'Royal Purple' },
  { id: 'graphite', label: 'Graphite' },
  { id: 'dark', label: 'Dark' },
];

const STORAGE_KEY = 'sr-theme';

interface Persisted {
  preset: ThemeId;
  primaryHex: string;
  accentHex: string;
  primaryRgb: string;
  accentRgb: string;
}

interface ThemeState {
  preset: ThemeId;
  primaryHex: string;
  accentHex: string;
  setPreset: (id: PresetId) => void;
  setCustom: (primaryHex: string, accentHex: string) => void;
}

const DEFAULTS = { primaryHex: '#1d4ed8', accentHex: '#b91c1c' };

function systemPreset(): PresetId {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'classic';
}

function load(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Persisted) : null;
  } catch {
    return null;
  }
}

function apply(preset: ThemeId, primaryHex: string, accentHex: string): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', preset);
  const vars = ['--color-primary', '--color-accent', '--color-on-primary', '--color-on-accent', '--color-ink'];
  if (preset === 'custom') {
    const p = hexToRgbChannels(primaryHex);
    const a = hexToRgbChannels(accentHex);
    root.style.setProperty('--color-primary', p);
    root.style.setProperty('--color-accent', a);
    root.style.setProperty('--color-on-primary', readableOn(p));
    root.style.setProperty('--color-on-accent', readableOn(a));
    // deep shade of the main color for the top bar, banners and footer
    root.style.setProperty('--color-ink', p.split(' ').map((n) => Math.round(Number(n) * 0.3)).join(' '));
  } else {
    vars.forEach((v) => root.style.removeProperty(v));
  }
  try {
    const persisted: Persisted = {
      preset,
      primaryHex,
      accentHex,
      primaryRgb: hexToRgbChannels(primaryHex),
      accentRgb: hexToRgbChannels(accentHex),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* storage unavailable (private mode): theme still applies for this visit */
  }
}

const saved = load();
const initial = {
  preset: saved?.preset ?? systemPreset(),
  primaryHex: saved?.primaryHex ?? DEFAULTS.primaryHex,
  accentHex: saved?.accentHex ?? DEFAULTS.accentHex,
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  ...initial,
  setPreset: (id) => {
    set({ preset: id });
    apply(id, get().primaryHex, get().accentHex);
  },
  setCustom: (primaryHex, accentHex) => {
    set({ preset: 'custom', primaryHex, accentHex });
    apply('custom', primaryHex, accentHex);
  },
}));

// Sync inline overrides with the persisted choice on startup.
apply(initial.preset, initial.primaryHex, initial.accentHex);
