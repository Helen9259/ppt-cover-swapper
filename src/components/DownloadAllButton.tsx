import type { PptxFileItem } from '../types';
import { downloadAllAsZip } from '../lib/zipDownload';

interface DownloadAllButtonProps {
  items: PptxFileItem[];
}

export default function DownloadAllButton({ items }: DownloadAllButtonProps) {
  const doneCount = items.filter((item) => item.status === 'done').length;
  const errorCount = items.filter((item) => item.status === 'error').length;

  if (items.length === 0) return null;

  return (
    <div className="download-all">
      <p className="download-all__summary">
        완료 {doneCount}개{errorCount > 0 ? ` · 오류 ${errorCount}개` : ''}
      </p>
      <button type="button" disabled={doneCount === 0} onClick={() => void downloadAllAsZip(items)}>
        전체 zip으로 다운로드
      </button>
    </div>
  );
}
