import { useBatchProcessor } from './hooks/useBatchProcessor';
import FileDropzone from './components/FileDropzone';
import ImageUploader from './components/ImageUploader';
import FileListPreview from './components/FileListPreview';
import ProcessButton from './components/ProcessButton';
import DownloadAllButton from './components/DownloadAllButton';

function App() {
  const {
    items,
    overlayImage,
    isProcessing,
    progress,
    addFiles,
    removeFile,
    setOverlayImage,
    clearOverlayImage,
    processAll,
  } = useBatchProcessor();

  const readyCount = items.filter((item) => item.status === 'ready-to-process').length;

  return (
    <div className="app">
      <header className="app__header">
        <h1>PPT 표지 이미지 일괄 교체기</h1>
        <p>
          여러 PPTX 파일의 표지(첫 슬라이드)를 새 이미지로 한 번에 교체하세요. 모든 처리는 브라우저에서만
          이루어지며 서버에 파일이 저장되지 않습니다.
        </p>
      </header>

      <section className="app__section">
        <h2>1. PPTX 파일 업로드</h2>
        <FileDropzone onFilesSelected={addFiles} />
      </section>

      <section className="app__section">
        <h2>2. 표지 이미지 업로드</h2>
        <ImageUploader
          overlayImage={overlayImage}
          onImageSelected={(f) => void setOverlayImage(f)}
          onClear={clearOverlayImage}
        />
      </section>

      <section className="app__section">
        <h2>3. 처리 &amp; 미리보기</h2>
        <ProcessButton
          disabled={!overlayImage || readyCount === 0}
          isProcessing={isProcessing}
          progress={progress}
          onProcess={() => void processAll()}
        />
        <FileListPreview items={items} onRemove={removeFile} />
      </section>

      <section className="app__section">
        <h2>4. 다운로드</h2>
        <DownloadAllButton items={items} />
      </section>
    </div>
  );
}

export default App;
