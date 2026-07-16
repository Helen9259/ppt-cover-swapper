export type FileStatus =
  | 'pending'
  | 'capturing'
  | 'ready-to-process'
  | 'processing'
  | 'done'
  | 'error';

export interface PptxFileItem {
  id: string;
  file: File;
  fileName: string;
  status: FileStatus;
  originalThumbnailUrl?: string;
  flattenedThumbnailUrl?: string;
  capturedImageBlob?: Blob;
  processedBlob?: Blob;
  slideWidthEmu?: number;
  slideHeightEmu?: number;
  errorMessage?: string;
}
