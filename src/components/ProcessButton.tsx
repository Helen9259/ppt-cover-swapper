interface ProcessButtonProps {
  disabled: boolean;
  isProcessing: boolean;
  progress: { done: number; total: number };
  onProcess: () => void;
}

export default function ProcessButton({ disabled, isProcessing, progress, onProcess }: ProcessButtonProps) {
  return (
    <div className="process-button">
      <button type="button" disabled={disabled || isProcessing} onClick={onProcess}>
        {isProcessing ? `처리 중… (${progress.done}/${progress.total})` : '일괄 처리 시작'}
      </button>
      {isProcessing && progress.total > 0 && (
        <div className="process-button__bar">
          <div
            className="process-button__bar-fill"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
