import type { PptxFileItem } from '../types';

interface FileCardProps {
  item: PptxFileItem;
  onRemove: (id: string) => void;
}

const STATUS_LABEL: Record<PptxFileItem['status'], string> = {
  pending: '대기 중',
  'rendering-preview': '미리보기 생성 중…',
  'ready-to-process': '처리 대기',
  processing: '처리 중…',
  done: '완료',
  error: '오류',
};

export default function FileCard({ item, onRemove }: FileCardProps) {
  return (
    <div className={`file-card file-card--${item.status}`}>
      <div className="file-card__thumbnails">
        <div className="file-card__thumb">
          <span className="file-card__thumb-label">Before</span>
          {item.beforeThumbnailUrl ? (
            <img src={item.beforeThumbnailUrl} alt={`${item.fileName} 원본 표지`} />
          ) : (
            <div className="file-card__thumb-placeholder" />
          )}
        </div>
        <div className="file-card__thumb">
          <span className="file-card__thumb-label">After</span>
          {item.afterThumbnailUrl ? (
            <img src={item.afterThumbnailUrl} alt={`${item.fileName} 변경된 표지`} />
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
