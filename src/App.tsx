import { useMemo } from 'react';
import { useBatchProcessor } from './hooks/useBatchProcessor';
import FileDropzone from './components/FileDropzone';
import FileListPreview from './components/FileListPreview';
import MissingFontUpload from './components/MissingFontUpload';
import ProcessButton from './components/ProcessButton';
import DownloadAllButton from './components/DownloadAllButton';

function App() {
  const { items, isProcessing, progress, addFiles, removeFile, processAll, provideFont } = useBatchProcessor();

  const readyCount = items.filter((item) => item.status === 'ready-to-process').length;
  const missingFontNames = useMemo(() => {
    const names = new Set<string>();
    items.forEach((item) => item.missingFontNames?.forEach((name) => names.add(name)));
    return Array.from(names);
  }, [items]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>PPT 첫 페이지 이미지 플랫화 도구</h1>
        <p>
          여러 PPTX 파일의 첫 슬라이드를 이미지로 캡처한 뒤, 같은 슬라이드 위에 그대로 다시 덮어씌워
          도형·텍스트를 이미지 한 장으로 플랫화합니다. 모든 처리는 브라우저에서만 이루어지며 서버에
          파일이 저장되지 않습니다.
        </p>
      </header>

      <section className="app__section">
        <h2>1. PPTX 파일 업로드</h2>
        <FileDropzone onFilesSelected={addFiles} />
        <MissingFontUpload missingFontNames={missingFontNames} onProvideFont={(name, file) => void provideFont(name, file)} />
      </section>

      <section className="app__section">
        <h2>2. 처리 &amp; 미리보기</h2>
        <ProcessButton
          disabled={readyCount === 0}
          isProcessing={isProcessing}
          progress={progress}
          onProcess={() => void processAll()}
        />
        <FileListPreview items={items} onRemove={removeFile} />
      </section>

      <section className="app__section">
        <h2>3. 다운로드</h2>
        <DownloadAllButton items={items} />
      </section>
    </div>
  );
}

export default App;
