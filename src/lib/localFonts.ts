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

/**
 * The Local Font Access API reports whatever the OS considers a font's primary family
 * name — for Windows' built-in Korean fonts that's usually the English name (e.g.
 * "Malgun Gothic"), even though PPTX files created with Korean PowerPoint almost always
 * store the Korean display name (e.g. "맑은 고딕") as the typeface. That's an exact-string
 * mismatch that would otherwise make an installed font invisible to name lookup. This
 * table maps between the two directions for the well-known legacy Windows Korean fonts.
 */
const KOREAN_FONT_NAME_ALIASES: [string, string][] = [
  ['맑은 고딕', 'Malgun Gothic'],
  ['굴림', 'Gulim'],
  ['굴림체', 'GulimChe'],
  ['돋움', 'Dotum'],
  ['돋움체', 'DotumChe'],
  ['바탕', 'Batang'],
  ['바탕체', 'BatangChe'],
  ['궁서', 'Gungsuh'],
  ['궁서체', 'GungsuhChe'],
];

function aliasesFor(name: string): string[] {
  const aliases: string[] = [];
  for (const [ko, en] of KOREAN_FONT_NAME_ALIASES) {
    if (name === ko) aliases.push(en);
    else if (name === en) aliases.push(ko);
  }
  return aliases;
}

let localFontIndex: Map<string, LocalFontData> | null = null;

export function hasLocalFontAccess(): boolean {
  return localFontIndex !== null;
}

export interface LocalFontAccessResult {
  granted: boolean;
  fontCount: number;
  /** Set when access failed, so the UI can show *why* instead of just "didn't work". */
  errorMessage?: string;
}

/**
 * Requests permission to read locally installed font files (Chrome/Edge only).
 * Must be called from a user gesture (e.g. a button click) — the browser will not
 * show the permission prompt otherwise. Once granted, the font list is cached for
 * the rest of the session.
 */
export async function requestLocalFontAccess(): Promise<LocalFontAccessResult> {
  if (!isLocalFontAccessSupported() || !window.queryLocalFonts) {
    return { granted: false, fontCount: 0, errorMessage: '이 브라우저는 Local Font Access API를 지원하지 않습니다.' };
  }
  try {
    const fonts = await window.queryLocalFonts();
    const index = new Map<string, LocalFontData>();
    for (const font of fonts) {
      // Prefer a "Regular"-looking style per family when multiple styles share a name.
      const keys = [font.family, ...aliasesFor(font.family)];
      for (const key of keys) {
        const existing = index.get(key);
        if (!existing || /regular/i.test(font.style)) {
          index.set(key, font);
        }
      }
    }
    localFontIndex = index;
    return { granted: true, fontCount: index.size };
  } catch (e) {
    // Common causes: the user (or an enterprise policy) denied the prompt, a prior
    // denial was already stored for this origin (no prompt shows on repeat calls in
    // that case), or the browser's global "Fonts" site permission is set to block —
    // all of which surface as a DOMException here rather than a UI dialog.
    console.error('[local-fonts] queryLocalFonts() failed:', e);
    const name = e instanceof DOMException ? e.name : e instanceof Error ? e.name : 'UnknownError';
    const message = e instanceof Error ? e.message : String(e);
    return { granted: false, fontCount: 0, errorMessage: `${name}: ${message}` };
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
      // Register under the name that was actually searched for (which may be a Korean
      // alias of font.family — see KOREAN_FONT_NAME_ALIASES), so the exact-name lookup
      // pptx-glimpse does against the PPTX's own typeface string succeeds.
      buffers.push({ name, data: await blob.arrayBuffer() });
    } catch {
      // Skip fonts that fail to read; the app still falls back to the bundled font.
    }
  }
  return buffers;
}
