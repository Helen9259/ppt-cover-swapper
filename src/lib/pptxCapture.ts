import { convertPptxToPng, initResvgWasm, type FontBuffer } from 'pptx-glimpse';
import resvgWasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';
import notoSansKrUrl from '@expo-google-fonts/noto-sans-kr/400Regular/NotoSansKR_400Regular.ttf?url';
import cafe24OneprettynightUrl from '@noonnu/cafe24-oneprettynight/fonts/cafe24oneprettynight-normal.woff?url';
import cafe24DangdanghaeUrl from '@noonnu/cafe24-dangdanghae/fonts/cafe24dangdanghae-normal.woff?url';

let wasmInitPromise: Promise<void> | null = null;

function ensureWasmInitialized(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = fetch(resvgWasmUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => initResvgWasm(buf));
  }
  return wasmInitPromise;
}

// Free, MIT-licensed Korean webfonts bundled by exact family name, in addition to the
// Noto Sans KR universal fallback. These are specifically the "노운눈(noonnu.cc)" Cafe24
// fonts that show up embedded in a lot of Korean PPT templates (e.g. from 카페24) — when
// a PPTX references one by name but doesn't ship it installed locally, this renders it
// correctly instead of silently substituting Noto Sans KR. (pptx-glimpse/opentype.js
// parses WOFF directly, so no format conversion is needed here.)
const NAMED_BUNDLED_FONTS: { name: string; url: string }[] = [
  { name: '카페24 고운밤', url: cafe24OneprettynightUrl },
  { name: '카페24 당당해', url: cafe24DangdanghaeUrl },
];

let fontsPromise: Promise<FontBuffer[]> | null = null;

/**
 * pptx-glimpse renders text as pre-resolved glyph outlines — it never falls back to
 * fonts installed on the viewer's system, so without at least one font buffer supplied
 * here, every run of text in every slide renders as nothing (fully invisible) rather
 * than erroring, which is easy to miss without a visual check. Noto Sans KR (Latin +
 * Hangul) is bundled first as the universal fallback: any font family the PPTX
 * references that we don't have an exact match for still resolves to this, so text is
 * always visible even if the weight/typeface isn't a pixel-perfect match. A handful of
 * specific Korean webfonts are bundled after it by exact name (see NAMED_BUNDLED_FONTS).
 */
function ensureFontsLoaded(): Promise<FontBuffer[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetch(notoSansKrUrl)
        .then((res) => res.arrayBuffer())
        .then((data): FontBuffer => ({ name: 'Noto Sans KR', data })),
      ...NAMED_BUNDLED_FONTS.map(({ name, url }) =>
        fetch(url)
          .then((res) => res.arrayBuffer())
          .then((data): FontBuffer => ({ name, data })),
      ),
    ]);
  }
  return fontsPromise;
}

/**
 * Render the first slide of a PPTX (File or Blob) to a PNG Blob.
 *
 * `extraFonts` are tried before falling back to the bundled font — pass locally
 * installed fonts here (see localFonts.ts) so exact family-name matches render with
 * the real typeface instead of the Noto Sans KR substitute. The bundled font is kept
 * first in registration order so it stays the deterministic default fallback for any
 * name that matches nothing.
 */
export async function captureFirstSlideAsImage(pptxData: File | Blob, extraFonts: FontBuffer[] = []): Promise<Blob> {
  const [, bundledFonts] = await Promise.all([ensureWasmInitialized(), ensureFontsLoaded()]);
  const fonts = [...bundledFonts, ...extraFonts];
  const buffer = await pptxData.arrayBuffer();
  const report = await convertPptxToPng(new Uint8Array(buffer), { slides: [1], width: 1920, fonts });
  const slide = report.slides[0];
  if (!slide) {
    throw new Error('첫 번째 슬라이드를 캡처할 수 없습니다.');
  }
  return new Blob([slide.png as unknown as BlobPart], { type: 'image/png' });
}
