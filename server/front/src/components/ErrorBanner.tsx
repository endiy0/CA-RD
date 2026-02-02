type ErrorBannerProps = {
  message: string;
  onClose?: () => void;
};

export default function ErrorBanner({ message, onClose }: ErrorBannerProps) {
  return (
    <div className="error-banner">
      <span>{message}</span>
      {onClose ? (
        <button type="button" onClick={onClose}>
          닫기
        </button>
      ) : null}
    </div>
  );
}
