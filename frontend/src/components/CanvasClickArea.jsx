import { useRef, useEffect, useState, useCallback } from 'react';
import { normalizeCoords, denormalizeCoords } from '../utils/normalize';

/**
 * Reusable HTML5 Canvas component for click-based authentication.
 * Renders an image, captures clicks, shows markers, and returns normalized coordinates.
 *
 * Props:
 *   imageSrc     - URL/path of image to display
 *   maxClicks    - Maximum number of clicks allowed
 *   minClicks    - Minimum clicks required
 *   onClicksChange(clicks) - Callback with array of {x, y} normalized coords
 *   readOnly     - If true, don't allow new clicks
 *   existingClicks - Array of {x, y} normalized to show (for login hints, etc.)
 *   showOrder    - Show click order numbers (default true)
 */
export default function CanvasClickArea({
  imageSrc,
  maxClicks = 6,
  minClicks = 3,
  onClicksChange,
  readOnly = false,
  existingClicks = [],
  showOrder = true,
}) {
  const canvasRef = useRef(null);
  const [clicks, setClicks] = useState([]);
  const [image, setImage] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 400 });
  const displayClicks = readOnly ? existingClicks : clicks;

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Scale to fit max 600px width while preserving aspect ratio
      const maxW = Math.min(600, window.innerWidth - 40);
      const scale = maxW / img.width;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      setCanvasSize({ w, h });
      setImage(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');

    // Clear and draw image
    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    ctx.drawImage(image, 0, 0, canvasSize.w, canvasSize.h);

    // Draw existing clicks (blue, for display)
    existingClicks.forEach((c, i) => {
      const px = denormalizeCoords(c.x, c.y, canvasSize.w, canvasSize.h);
      drawMarker(ctx, px.x, px.y, i + 1, '#3b82f6', showOrder);
    });

    // Draw user clicks (red)
    clicks.forEach((c, i) => {
      const px = denormalizeCoords(c.x, c.y, canvasSize.w, canvasSize.h);
      drawMarker(ctx, px.x, px.y, i + 1, '#ef4444', showOrder);
    });
  }, [image, clicks, existingClicks, canvasSize, showOrder]);

  useEffect(() => { draw(); }, [draw]);

  function drawMarker(ctx, x, y, num, color, showNumber) {
    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner fill
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = color + 'cc';
    ctx.fill();

    // Glow
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.strokeStyle = color + '40';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Number
    if (showNumber) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num, x, y);
    }
  }

  const handleClick = (e) => {
    if (readOnly || clicks.length >= maxClicks) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalized = normalizeCoords(x, y, canvasSize.w, canvasSize.h);

    const newClicks = [...clicks, normalized];
    setClicks(newClicks);
    onClicksChange?.(newClicks);
  };

  const handleUndo = () => {
    const newClicks = clicks.slice(0, -1);
    setClicks(newClicks);
    onClicksChange?.(newClicks);
  };

  const handleReset = () => {
    setClicks([]);
    onClicksChange?.([]);
  };

  return (
    <div className="canvas-wrapper">
      <div className="canvas-container" onClick={handleClick}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
        />
      </div>

      {/* Click counter dots */}
      <div className="click-counter">
        {Array.from({ length: maxClicks }).map((_, i) => (
          <div
            key={i}
            className={`click-dot ${i < displayClicks.length ? 'filled' : ''}`}
          />
        ))}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
          {displayClicks.length}/{maxClicks} clicks
          {displayClicks.length < minClicks && ` (min ${minClicks})`}
        </span>
      </div>

      {!readOnly && clicks.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleUndo}>
            ↩ Undo Last
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            ✕ Reset All
          </button>
        </div>
      )}

      <style>{`
        .canvas-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
