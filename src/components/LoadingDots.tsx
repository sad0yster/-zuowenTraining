import './LoadingDots.css';

interface LoadingDotsProps {
  text?: string;
}

export function LoadingDots({ text = '教练正在思考' }: LoadingDotsProps) {
  return (
    <span className="loading-dots">
      <span>{text}</span>
      <span className="dots">
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </span>
  );
}
