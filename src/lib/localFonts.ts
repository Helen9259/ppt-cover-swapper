import type { FontBuffer } from 'pptx-glimpse';

interface LocalFontData {
  readonly family: string;
  readonly fullName: string;
  readonly postscriptName: string;
  readonly style: string;
  blob(): Promise<Blob>;
}

declare global {
  interface Window {
    queryLocalFonts?: () => Promise<LocalFontData[]>;
  }
}

export function isLocalFontAccessSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.queryLocalFonts === 'function';
}

let localFontIndex: Map<string, LocalFontData> | null = null;

export function hasLocalFontAccess(): boolean {
  return localFontIndex !== null;
}

/**
 * Requests permission to read locally installed font files (Chrome/Edge only).
 * Must be called from a user gesture (e.g. a button click) — the browser will not
 * show the permission prompt otherwise. Once granted, the font list is cached for
 * the rest of the session.
 */
export async function requestLocalFontAccess(): Promise<{ granted: boolean; fontCount: number }> {
  if (!isLocalFontAccessSupported() || !window.queryLocalFonts) {
    return { granted: false, fontCount: 0 };
  }
  try {
    const fonts = await window.queryLocalFonts();
    const index = new Map<string, LocalFontData>();
    for (const font of fonts) {
      // Prefer a "Regular"-looking style per family when multiple styles share a name.
      const existing = index.get(font.family);
      if (!existing || /regular/i.test(font.style)) {
        index.set(font.family, font);
      }
    }
    localFontIndex = index;
    return { granted: true, fontCount: index.size };
  } catch {
    // User denied the permission prompt, or it was dismissed.
    return { granted: false, fontCount: 0 };
  }
}

/** Fetches font file bytes for any of the given family names that are installed locally. */
export async function getLocalFontBuffers(familyNames: Iterable<string>): Promise<FontBuffer[]> {
  if (!localFontIndex) return [];
  const buffers: FontBuffer[] = [];
  for (const name of familyNames) {
    const font = localFontIndex.get(name);
    if (!font) continue;
    try {
      const blob = await font.blob();
      buffers.push({ name: font.family, data: await blob.arrayBuffer() });
    } catch {
      // Skip fonts that fail to read; the app still falls back to the bundled font.
    }
  }
  return buffers;
}
