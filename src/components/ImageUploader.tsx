import { useRef } from 'react';
import type { OverlayImage } from '../types';

interface ImageUploaderProps {
  overlayImage: OverlayImage | null;
  onImageSelected: (file: File) => void;
  onClear: () => void;
}

export default function ImageUploader({ overlayImage, onImageSelected, onClear }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="image-uploader">
      {overlayImage ? (
        <div className="image-uploader__preview">
          <img src={overlayImage.previewUrl} alt="표지 오버레이 이미지 미리보기" />
          <div className="image-uploader__meta">
            <span>{overlayImage.file.name}</span>
            <span>
              {overlayImage.naturalWidth} × {overlayImage.naturalHeight}px
            </span>
            <button type="button" onClick={onClear}>
              이미지 제거
            </button>
          </div>
        </div>
      ) : (
        <div className="image-uploader__empty" onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
          <p>표지에 사용할 이미지를 업로드하세요</p>
          <p className="image-uploader__hint">모든 PPTX 파일에 공통으로 적용됩니다.</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImageSelected(file);
          e.target.value = '';
        }}
      />
      {overlayImage && (
        <button type="button" className="image-uploader__change" onClick={() => inputRef.current?.click()}>
          다른 이미지 선택
        </button>
      )}
    </div>
  );
}
