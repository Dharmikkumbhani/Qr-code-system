import './LoadingSpinner.css';

export default function LoadingSpinner({ fullscreen = false }) {
  if (fullscreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-ring" />
        <p className="spinner-text">Loading menu…</p>
      </div>
    );
  }
  return <div className="spinner-ring spinner-sm" />;
}
