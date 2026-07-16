import type { PptxFileItem } from '../types';
import FileCard from './FileCard';

interface FileListPreviewProps {
  items: PptxFileItem[];
  onRemove: (id: string) => void;
}

export default function FileListPreview({ items, onRemove }: FileListPreviewProps) {
  if (items.length === 0) {
    return <p className="file-list__empty">업로드된 PPTX 파일이 없습니다.</p>;
  }

  return (
    <div className="file-list">
      {items.map((item) => (
        <FileCard key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}
