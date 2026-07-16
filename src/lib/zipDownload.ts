import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { PptxFileItem } from '../types';

export async function downloadAllAsZip(items: PptxFileItem[]): Promise<void> {
  const zip = new JSZip();
  const doneItems = items.filter((item) => item.status === 'done' && item.processedBlob);

  for (const item of doneItems) {
    zip.file(item.fileName, item.processedBlob!);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, 'ppt_covers_flattened.zip');
}
