# PPT 첫 페이지 이미지 플랫화 도구 (PPT Cover Flattener)

여러 PPTX 파일의 첫 번째 슬라이드를 PNG 이미지로 캡처한 뒤, 그 캡처 이미지를 같은 슬라이드 위에
슬라이드 크기 그대로 다시 덮어씌워서 기존 도형·텍스트를 이미지 한 장으로 "플랫화"하는 브라우저
기반 도구입니다. 사용자가 별도의 이미지를 업로드하지 않으며, PPT 파일 자체의 첫 슬라이드만을
소스로 사용합니다. 로그인이 필요 없고, 파일은 서버로 전송되지 않으며 모든 처리가 브라우저 안에서만
이루어집니다.

## 사용 방법

1. PPTX 파일을 하나 이상 업로드합니다 (드래그 앤 드롭 또는 클릭하여 선택). 업로드 즉시 각 파일의
   첫 슬라이드가 PNG로 캡처됩니다.
2. "일괄 처리 시작" 버튼을 눌러 캡처된 이미지를 같은 슬라이드 위에 슬라이드 크기 그대로 다시
   삽입합니다 (도형·텍스트가 이미지 한 장으로 플랫화됩니다).
3. 파일별 원본/플랫화 후 미리보기를 확인한 뒤 — 두 이미지가 시각적으로 동일해야 정상입니다 —
   zip으로 모두 다운로드합니다.

구조가 예상과 다른 PPTX 파일(예: 첫 슬라이드를 찾을 수 없는 경우)은 오류로 표시되며,
나머지 파일 처리에는 영향을 주지 않습니다.

## 폰트 렌더링

브라우저는 PPTX가 참조하는 폰트를 자동으로 알지 못하므로, 기본적으로 Noto Sans KR(한글+영문)을
대체 폰트로 내장해 사용합니다. 여기에 더해 PPT 템플릿에 자주 쓰이는 무료 한글 웹폰트 몇 가지
(카페24 고운밤, 카페24 당당해)도 정확한 이름으로 함께 내장되어 있어, 해당 폰트를 참조하는 PPT는
로컬 설치나 권한 없이도 정확히 렌더링됩니다 (`src/lib/pptxCapture.ts`의 `NAMED_BUNDLED_FONTS`에서
필요에 따라 추가 가능).

Chrome/Edge에서는 "로컬 폰트 읽기 허용" 버튼으로 Local Font Access API 권한을 주면, 이 컴퓨터에
설치된 폰트 파일을 읽기 전용으로 읽어와 PPTX가 참조하는 폰트와 정확히 일치할 때 그 폰트로
렌더링합니다. 맑은 고딕/굴림/돋움/바탕/궁서 등 레거시 한글 Windows 폰트는 PPT에는 한글 이름으로,
OS에는 영문 이름으로 등록되어 있는 경우가 많아 `src/lib/localFonts.ts`의
`KOREAN_FONT_NAME_ALIASES`에서 양방향으로 매핑해 매칭합니다. 그 외 폰트는 설치되어 있지 않으면
계속 대체 폰트로 표시됩니다. Safari/Firefox는 이 API를 지원하지 않습니다.

**한계**: PPT 파일 자체에 폰트가 내장(embed)되어 있는 경우(파워포인트의 "파일에 글꼴 포함" 저장
옵션, `ppt/fonts/*.fntdata`)는 지원하지 않습니다. 이 폰트 데이터는 OOXML 스펙에 따라 난독화되어
있어 신뢰할 수 있는 참고 구현 없이 직접 구현하는 것은 위험 부담이 있다고 판단해 보류했습니다 —
대신 위 대체 폰트/로컬 폰트 매칭으로 최대한 커버합니다.

## 기술 스택

- Vite + React 18 + TypeScript
- [JSZip](https://stuk.github.io/jszip/) — PPTX(zip) 읽기/쓰기
- 브라우저 내장 `DOMParser` / `XMLSerializer` — 슬라이드 XML 파싱 및 수정
- [pptx-glimpse](https://github.com/hirokisakabe/pptx-glimpse) — 브라우저에서 PPTX 슬라이드를 PNG로 캡처/렌더링 (LibreOffice 불필요)
- [file-saver](https://github.com/eligrey/FileSaver.js) — zip 다운로드 트리거
- [Local Font Access API](https://developer.mozilla.org/en-US/docs/Web/API/Window/queryLocalFonts) (선택적) — 로컬 설치 폰트 읽기 (Chrome/Edge)

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

저장소의 **Settings → Pages → Build and deployment → Source**가 "GitHub Actions"로 설정되어 있어야 합니다.
