import { useCallback, useRef, useState, type DragEvent } from 'react';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
}

export default function FileDropzone({ onFilesSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected],
  );

  return (
    <div
      className={`dropzone${isDragOver ? ' dropzone--active' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <p className="dropzone__title">PPTX 파일을 드래그하거나 클릭하여 업로드</p>
      <p className="dropzone__hint">여러 파일을 한 번에 선택할 수 있습니다.</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pptx"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length > 0) onFilesSelected(files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
