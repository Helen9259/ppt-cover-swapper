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

/** Render the first slide of a PPTX (File or Blob) to a PNG object URL. */
export async function renderFirstSlideThumbnail(pptxData: File | Blob): Promise<string> {
  await ensureWasmInitialized();
  const buffer = await pptxData.arrayBuffer();
  const report = await convertPptxToPng(new Uint8Array(buffer), { slides: [1], width: 480 });
  const slide = report.slides[0];
  if (!slide) {
    throw new Error('슬라이드 미리보기를 렌더링할 수 없습니다.');
  }
  const blob = new Blob([slide.png as unknown as BlobPart], { type: 'image/png' });
  return URL.createObjectURL(blob);
}
