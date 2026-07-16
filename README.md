# PPT 표지 이미지 일괄 교체기 (PPT Cover Swapper)

여러 PPTX 파일의 첫 번째 슬라이드(표지)를 하나의 공통 이미지로 한 번에 교체하는 브라우저 기반 도구입니다.
로그인이 필요 없고, 파일은 서버로 전송되지 않으며 모든 처리가 브라우저 안에서만 이루어집니다.

## 사용 방법

1. PPTX 파일을 하나 이상 업로드합니다 (드래그 앤 드롭 또는 클릭하여 선택).
2. 표지에 사용할 이미지를 업로드합니다. 모든 PPTX 파일에 공통으로 적용됩니다.
3. "일괄 처리 시작" 버튼을 눌러 각 파일의 표지를 교체합니다. 이미지는 슬라이드 크기 안에서
   비율을 유지한 채 자동으로 맞춰집니다.
4. 파일별 Before/After 미리보기를 확인한 뒤, zip으로 모두 다운로드합니다.

구조가 예상과 다른 PPTX 파일(예: 첫 슬라이드를 찾을 수 없는 경우)은 오류로 표시되며,
나머지 파일 처리에는 영향을 주지 않습니다.

## 기술 스택

- Vite + React 18 + TypeScript
- [JSZip](https://stuk.github.io/jszip/) — PPTX(zip) 읽기/쓰기
- 브라우저 내장 `DOMParser` / `XMLSerializer` — 슬라이드 XML 파싱 및 수정
- [pptx-glimpse](https://github.com/hirokisakabe/pptx-glimpse) — 브라우저에서 PPTX 슬라이드를 PNG로 렌더링 (LibreOffice 불필요)
- [file-saver](https://github.com/eligrey/FileSaver.js) — zip 다운로드 트리거

## 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

정적 사이트로 빌드되며 백엔드가 필요하지 않습니다.

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드해서 GitHub Pages로 배포합니다.
GitHub Pages 프로젝트 사이트(`https://<owner>.github.io/ppt-cover-swapper/`)로 서빙되므로
`vite.config.ts`의 `base`가 `/ppt-cover-swapper/`로 고정되어 있습니다. 저장소 이름을 바꾸면 함께 수정해야 합니다.

저장소의 **Settings → Pages → Build and deployment → Source**를 "GitHub Actions"로 설정해야 워크플로우가 배포 권한을 갖습니다.
