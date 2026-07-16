import { useCallback, useEffect, useRef, useState } from 'react';
import type { OverlayImage, PptxFileItem } from '../types';
import { getSlideDimensions, overlayImageOnFirstSlide } from '../lib/pptxProcessor';
import { renderFirstSlideThumbnail } from '../lib/pptxPreview';

function makeId(): string {
  return crypto.randomUUID();
}

export function useBatchProcessor() {
  const [items, setItems] = useState<PptxFileItem[]>([]);
  const [overlayImage, setOverlayImageState] = useState<OverlayImage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const updateItem = useCallback((id: string, patch: Partial<PptxFileItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const analyzeFile = useCallback(async (id: string, file: File) => {
    updateItem(id, { status: 'rendering-preview' });
    try {
      const { widthEmu, heightEmu } = await getSlideDimensions(file);
      const beforeThumbnailUrl = await renderFirstSlideThumbnail(file);
      updateItem(id, {
        status: 'ready-to-process',
        slideWidthEmu: widthEmu,
        slideHeightEmu: heightEmu,
        beforeThumbnailUrl,
      });
    } catch (e) {
      updateItem(id, {
        status: 'error',
        errorMessage: e instanceof Error ? e.message : '알 수 없는 오류로 파일을 분석할 수 없습니다.',
      });
    }
  }, [updateItem]);

  const addFiles = useCallback((files: File[]) => {
    const pptxFiles = files.filter((f) => f.name.toLowerCase().endsWith('.pptx'));
    const newItems: PptxFileItem[] = pptxFiles.map((file) => ({
      id: makeId(),
      file,
      fileName: file.name,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);
    newItems.forEach((item) => {
      void analyzeFile(item.id, item.file);
    });
  }, [analyzeFile]);

  const removeFile = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.beforeThumbnailUrl) URL.revokeObjectURL(target.beforeThumbnailUrl);
      if (target?.afterThumbnailUrl) URL.revokeObjectURL(target.afterThumbnailUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const setOverlayImage = useCallback(async (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    const bitmap = await createImageBitmap(file);
    const naturalWidth = bitmap.width;
    const naturalHeight = bitmap.height;
    bitmap.close();

    setOverlayImageState((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return { file, previewUrl, naturalWidth, naturalHeight };
    });

    // Invalidate previously-processed results so a stale image isn't shipped in the zip.
    setItems((prev) =>
      prev.map((item) => {
        if (item.status !== 'done') return item;
        if (item.afterThumbnailUrl) URL.revokeObjectURL(item.afterThumbnailUrl);
        return { ...item, status: 'ready-to-process', processedBlob: undefined, afterThumbnailUrl: undefined };
      }),
    );
  }, []);

  const clearOverlayImage = useCallback(() => {
    setOverlayImageState((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }, []);

  const processAll = useCallback(async () => {
    const current = itemsRef.current;
    const image = overlayImage;
    if (!image) return;

    const toProcess = current.filter((item) => item.status === 'ready-to-process');
    if (toProcess.length === 0) return;

    setIsProcessing(true);
    setProgress({ done: 0, total: toProcess.length });

    let completed = 0;
    for (const item of toProcess) {
      updateItem(item.id, { status: 'processing' });
      try {
        const processedBlob = await overlayImageOnFirstSlide(item.file, image.file);
        const afterThumbnailUrl = await renderFirstSlideThumbnail(processedBlob);
        updateItem(item.id, { status: 'done', processedBlob, afterThumbnailUrl });
      } catch (e) {
        updateItem(item.id, {
          status: 'error',
          errorMessage: e instanceof Error ? e.message : '알 수 없는 오류로 파일을 처리할 수 없습니다.',
        });
      }
      completed += 1;
      setProgress({ done: completed, total: toProcess.length });
    }

    setIsProcessing(false);
  }, [overlayImage, updateItem]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.beforeThumbnailUrl) URL.revokeObjectURL(item.beforeThumbnailUrl);
        if (item.afterThumbnailUrl) URL.revokeObjectURL(item.afterThumbnailUrl);
      });
    };
  }, []);

  return {
    items,
    overlayImage,
    isProcessing,
    progress,
    addFiles,
    removeFile,
    setOverlayImage,
    clearOverlayImage,
    processAll,
  };
}
