import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * 8×8 Grid Overlay for pattern-based authentication.
 * Renders an image with grid nodes; user clicks nodes to form a pattern.
 *
 * Props:
 *   imageSrc          - Image URL
 *   gridSize          - Grid dimension (default 8)
 *   onPatternChange   - Callback with array of node indices
 *   readOnly          - Disable input
 *   existingPattern   - Array of node indices to display
 */
export default function GridOverlay({
  imageSrc,
  gridSize = 8,
  onPatternChange,
  readOnly = false,
  existingPattern = [],
}) {
  const canvasRef = useRef(null);
  const [pattern, setPattern] = useState([]);
  const [image, setImage] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 600 });
  const [hoverNode, setHoverNode] = useState(-1);

  // Load image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = Math.min(600, window.innerWidth - 40);
      const scale = maxW / img.width;
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      setCanvasSize({ w, h });
      setImage(img);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const getNodePosition = useCallback((index) => {
    const cellW = canvasSize.w / gridSize;
    const cellH = canvasSize.h / gridSize;
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    return {
      x: col * cellW + cellW / 2,
      y: row * cellH + cellH / 2,
    };
  }, [canvasSize, gridSize]);

  const getNodeFromPos = useCallback((px, py) => {
    const cellW = canvasSize.w / gridSize;
    const cellH = canvasSize.h / gridSize;
    const nodeRadius = Math.min(cellW, cellH) * 0.3;

    for (let i = 0; i < gridSize * gridSize; i++) {
      const pos = getNodePosition(i);
      const dist = Math.sqrt((px - pos.x) ** 2 + (py - pos.y) ** 2);
      if (dist <= nodeRadius) return i;
    }
    return -1;
  }, [canvasSize, gridSize, getNodePosition]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
    ctx.drawImage(image, 0, 0, canvasSize.w, canvasSize.h);

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    const cellW = canvasSize.w / gridSize;
    const cellH = canvasSize.h / gridSize;
    const nodeRadius = Math.min(cellW, cellH) * 0.15;

    const activePattern = existingPattern.length > 0 ? existingPattern : pattern;

    // Draw grid lines (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 1; i < gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, canvasSize.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(canvasSize.w, i * cellH);
      ctx.stroke();
    }

    // Draw connections
    if (activePattern.length > 1) {
      ctx.beginPath();
      const startPos = getNodePosition(activePattern[0]);
      ctx.moveTo(startPos.x, startPos.y);
      for (let i = 1; i < activePattern.length; i++) {
        const pos = getNodePosition(activePattern[i]);
        ctx.lineTo(pos.x, pos.y);
      }
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#6366f1';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw nodes
    for (let i = 0; i < gridSize * gridSize; i++) {
      const pos = getNodePosition(i);
      const isActive = activePattern.includes(i);
      const isHovered = hoverNode === i;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isActive ? nodeRadius * 1.4 : nodeRadius, 0, Math.PI * 2);

      if (isActive) {
        const idx = activePattern.indexOf(i);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        // Glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, nodeRadius * 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Number
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${Math.round(nodeRadius)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(idx + 1, pos.x, pos.y);
      } else {
        ctx.fillStyle = isHovered
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [image, pattern, existingPattern, canvasSize, gridSize, hoverNode, getNodePosition]);

  useEffect(() => { draw(); }, [draw]);

  const handleClick = (e) => {
    if (readOnly) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeFromPos(x, y);
    if (node < 0) return;

    // Toggle: if already in pattern, remove from that point
    const idx = pattern.indexOf(node);
    let newPattern;
    if (idx >= 0) {
      newPattern = pattern.slice(0, idx);
    } else {
      newPattern = [...pattern, node];
    }
    setPattern(newPattern);
    onPatternChange?.(newPattern);
  };

  const handleMouseMove = (e) => {
    if (readOnly) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setHoverNode(getNodeFromPos(x, y));
  };

  const handleReset = () => {
    setPattern([]);
    onPatternChange?.([]);
  };

  return (
    <div className="canvas-wrapper">
      <div className="canvas-container" onClick={handleClick} onMouseMove={handleMouseMove}>
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
        />
      </div>

      <div className="click-counter">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {pattern.length} nodes selected
          {pattern.length < 4 && ' (min 4)'}
        </span>
      </div>

      {!readOnly && pattern.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleReset}>
            ✕ Reset Pattern
          </button>
        </div>
      )}
    </div>
  );
}
