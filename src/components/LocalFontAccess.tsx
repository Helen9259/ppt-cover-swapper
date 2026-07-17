interface LocalFontAccessProps {
  supported: boolean;
  granted: boolean;
  fontCount: number;
  onEnable: () => void;
}

export default function LocalFontAccess({ supported, granted, fontCount, onEnable }: LocalFontAccessProps) {
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
    </div>
  );
}
