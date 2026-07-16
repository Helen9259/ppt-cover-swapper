import { convertPptxToPng, initResvgWasm, type FontBuffer } from 'pptx-glimpse';
import resvgWasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';
import notoSansKrUrl from '@expo-google-fonts/noto-sans-kr/400Regular/NotoSansKR_400Regular.ttf?url';

let wasmInitPromise: Promise<void> | null = null;

function ensureWasmInitialized(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = fetch(resvgWasmUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => initResvgWasm(buf));
  }
  return wasmInitPromise;
}

let fontsPromise: Promise<FontBuffer[]> | null = null;

/**
 * pptx-glimpse renders text as pre-resolved glyph outlines — it never falls back to
 * fonts installed on the viewer's system, so without at least one font buffer supplied
 * here, every run of text in every slide renders as nothing (fully invisible) rather
 * than erroring, which is easy to miss without a visual check. We bundle a single
 * Latin+Hangul font (Noto Sans KR) as the universal fallback: any font family the PPTX
 * references that we don't have an exact match for still resolves to this, so text is
 * always visible even if the weight/typeface isn't a pixel-perfect match.
 */
function ensureFontsLoaded(): Promise<FontBuffer[]> {
  if (!fontsPromise) {
    fontsPromise = fetch(notoSansKrUrl)
      .then((res) => res.arrayBuffer())
      .then((data) => [{ name: 'Noto Sans KR', data }]);
  }
  return fontsPromise;
}

/** Render the first slide of a PPTX (File or Blob) to a PNG Blob. */
export async function captureFirstSlideAsImage(pptxData: File | Blob): Promise<Blob> {
  const [, fonts] = await Promise.all([ensureWasmInitialized(), ensureFontsLoaded()]);
  const buffer = await pptxData.arrayBuffer();
  const report = await convertPptxToPng(new Uint8Array(buffer), { slides: [1], width: 1920, fonts });
  const slide = report.slides[0];
  if (!slide) {
    throw new Error('첫 번째 슬라이드를 캡처할 수 없습니다.');
  }
  return new Blob([slide.png as unknown as BlobPart], { type: 'image/png' });
}
