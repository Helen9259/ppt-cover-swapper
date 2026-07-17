interface LocalFontAccessProps {
  supported: boolean;
  granted: boolean;
  fontCount: number;
  errorMessage: string | null;
  onEnable: () => void;
}

export default function LocalFontAccess({ supported, granted, fontCount, errorMessage, onEnable }: LocalFontAccessProps) {
  if (!supported) {
    return (
      <p className="local-fonts local-fonts--unsupported">
        이 브라우저는 로컬 폰트 읽기를 지원하지 않습니다 (Chrome 또는 Edge 최신 버전 필요). 대체 폰트로
        렌더링됩니다.
      </p>
    );
  }

  if (granted) {
    return (
      <p className="local-fonts local-fonts--granted">
        로컬 폰트 사용 중 ({fontCount.toLocaleString()}개 인식됨) — PPT가 참조하는 폰트가 설치되어 있으면
        정확한 폰트로 렌더링됩니다.
      </p>
    );
  }

  return (
    <div className="local-fonts">
      <p>
        기본적으로 대체 폰트(Noto Sans KR)로 렌더링됩니다. 이 컴퓨터에 설치된 폰트를 그대로 사용하려면
        읽기 전용으로 접근을 허용해주세요.
      </p>
      <button type="button" onClick={onEnable}>
        로컬 폰트 읽기 허용
      </button>
      {errorMessage && (
        <p className="local-fonts__error">
          권한을 가져오지 못했습니다: {errorMessage}
          <br />
          브라우저 주소창 왼쪽 아이콘 → 사이트 설정에서 "글꼴" 권한이 차단으로 되어 있지 않은지,
          또는 <code>chrome://settings/content/localFonts</code>에서 전체적으로 차단되어 있지 않은지
          확인해주세요.
        </p>
      )}
    </div>
  );
}
