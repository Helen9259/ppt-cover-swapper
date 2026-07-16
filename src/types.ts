export type FileStatus =
  | 'pending'
  | 'rendering-preview'
  | 'ready-to-process'
  | 'processing'
  | 'done'
  | 'error';

export interface PptxFileItem {
  id: string;
  file: File;
  fileName: string;
  status: FileStatus;
  beforeThumbnailUrl?: string;
  afterThumbnailUrl?: string;
  processedBlob?: Blob;
  slideWidthEmu?: number;
  slideHeightEmu?: number;
  errorMessage?: string;
}

export interface OverlayImage {
  file: File;
  previewUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}

export interface FitResult {
  offsetXEmu: number;
  offsetYEmu: number;
  widthEmu: number;
  heightEmu: number;
}
