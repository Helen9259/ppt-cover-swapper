import { convertPptxToPng, initResvgWasm } from 'pptx-glimpse';
import resvgWasmUrl from '@resvg/resvg-wasm/index_bg.wasm?url';

let wasmInitPromise: Promise<void> | null = null;

function ensureWasmInitialized(): Promise<void> {
  if (!wasmInitPromise) {
    wasmInitPromise = fetch(resvgWasmUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => initResvgWasm(buf));
  }
  return wasmInitPromise;
}

/** Render the first slide of a PPTX (File or Blob) to a PNG Blob. */
export async function captureFirstSlideAsImage(pptxData: File | Blob): Promise<Blob> {
  await ensureWasmInitialized();
  const buffer = await pptxData.arrayBuffer();
  const report = await convertPptxToPng(new Uint8Array(buffer), { slides: [1], width: 1920 });
  const slide = report.slides[0];
  if (!slide) {
    throw new Error('첫 번째 슬라이드를 캡처할 수 없습니다.');
  }
  return new Blob([slide.png as unknown as BlobPart], { type: 'image/png' });
}
