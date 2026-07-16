import { useCallback, useEffect, useRef, useState } from 'react';
import type { PptxFileItem } from '../types';
import { flattenFirstSlideWithCapturedImage, getSlideDimensions } from '../lib/pptxProcessor';
import { captureFirstSlideAsImage } from '../lib/pptxCapture';

function makeId(): string {
  return crypto.randomUUID();
}

export function useBatchProcessor() {
  const [items, setItems] = useState<PptxFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const updateItem = useCallback((id: string, patch: Partial<PptxFileItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const analyzeFile = useCallback(async (id: string, file: File) => {
    updateItem(id, { status: 'capturing' });
    try {
      const { widthEmu, heightEmu } = await getSlideDimensions(file);
      const capturedImageBlob = await captureFirstSlideAsImage(file);
      const originalThumbnailUrl = URL.createObjectURL(capturedImageBlob);
      updateItem(id, {
        status: 'ready-to-process',
        slideWidthEmu: widthEmu,
        slideHeightEmu: heightEmu,
        capturedImageBlob,
        originalThumbnailUrl,
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
      if (target?.originalThumbnailUrl) URL.revokeObjectURL(target.originalThumbnailUrl);
      if (target?.flattenedThumbnailUrl) URL.revokeObjectURL(target.flattenedThumbnailUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const processAll = useCallback(async () => {
    const toProcess = itemsRef.current.filter((item) => item.status === 'ready-to-process');
    if (toProcess.length === 0) return;

    setIsProcessing(true);
    setProgress({ done: 0, total: toProcess.length });

    let completed = 0;
    for (const item of toProcess) {
      updateItem(item.id, { status: 'processing' });
      try {
        if (!item.capturedImageBlob) {
          throw new Error('캡처된 이미지가 없습니다.');
        }
        const processedBlob = await flattenFirstSlideWithCapturedImage(item.file, item.capturedImageBlob);
        const flattenedCapture = await captureFirstSlideAsImage(processedBlob);
        const flattenedThumbnailUrl = URL.createObjectURL(flattenedCapture);
        updateItem(item.id, { status: 'done', processedBlob, flattenedThumbnailUrl });
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
  }, [updateItem]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.originalThumbnailUrl) URL.revokeObjectURL(item.originalThumbnailUrl);
        if (item.flattenedThumbnailUrl) URL.revokeObjectURL(item.flattenedThumbnailUrl);
      });
    };
  }, []);

  return {
    items,
    isProcessing,
    progress,
    addFiles,
    removeFile,
    processAll,
  };
}
