interface MissingFontUploadProps {
  missingFontNames: string[];
  onProvideFont: (fontName: string, file: File) => void;
}

export default function MissingFontUpload({ missingFontNames, onProvideFont }: MissingFontUploadProps) {
  if (missingFontNames.length === 0) return null;

  return (
    <div className="missing-fonts">
      <p className="missing-fonts__title">
        아래 폰트를 찾을 수 없어 대체 폰트로 표시되고 있습니다. 폰트 파일(.ttf/.otf/.woff)이 있다면
        업로드해서 정확한 폰트로 다시 캡처할 수 있습니다.
      </p>
      <ul className="missing-fonts__list">
        {missingFontNames.map((name) => (
          <li key={name} className="missing-fonts__item">
            <span className="missing-fonts__name">{name}</span>
            <label className="missing-fonts__upload">
              폰트 업로드
              <input
                type="file"
                accept=".ttf,.otf,.woff,font/ttf,font/otf,font/woff"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onProvideFont(name, file);
                  e.target.value = '';
                }}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
