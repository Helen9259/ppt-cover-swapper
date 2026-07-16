import type { PptxFileItem } from '../types';

interface FileCardProps {
  item: PptxFileItem;
  onRemove: (id: string) => void;
}

const STATUS_LABEL: Record<PptxFileItem['status'], string> = {
  pending: '대기 중',
  capturing: '캡처 중…',
  'ready-to-process': '처리 대기',
  processing: '플랫화 중…',
  done: '완료',
  error: '오류',
};

export default function FileCard({ item, onRemove }: FileCardProps) {
  return (
    <div className={`file-card file-card--${item.status}`}>
      <div className="file-card__thumbnails">
        <div className="file-card__thumb">
          <span className="file-card__thumb-label">원본</span>
          {item.originalThumbnailUrl ? (
            <img src={item.originalThumbnailUrl} alt={`${item.fileName} 원본 표지`} />
          ) : (
            <div className="file-card__thumb-placeholder" />
          )}
        </div>
        <div className="file-card__thumb">
          <span className="file-card__thumb-label">플랫화 후</span>
          {item.flattenedThumbnailUrl ? (
            <img src={item.flattenedThumbnailUrl} alt={`${item.fileName} 플랫화된 표지`} />
          ) : (
            <div className="file-card__thumb-placeholder" />
          )}
        </div>
      </div>
      <div className="file-card__info">
        <span className="file-card__name" title={item.fileName}>
          {item.fileName}
        </span>
        <span className={`file-card__status file-card__status--${item.status}`}>{STATUS_LABEL[item.status]}</span>
        {item.status === 'error' && item.errorMessage && (
          <span className="file-card__error">{item.errorMessage}</span>
        )}
      </div>
      <button type="button" className="file-card__remove" onClick={() => onRemove(item.id)} aria-label="파일 제거">
        ✕
      </button>
    </div>
  );
}
