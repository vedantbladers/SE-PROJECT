/**
 * 3×3 PassFace selection grid for one challenge round.
 *
 * Props:
 *   images      - [{id, url}] array of 9 images
 *   onSelect    - Callback with selected image ID
 *   selectedId  - Currently selected ID (null if none)
 *   roundNumber - Current round number
 *   totalRounds - Total rounds
 *   disabled    - Disable selection
 */
export default function PassFaceGrid({
  images = [],
  onSelect,
  selectedId = null,
  roundNumber = 1,
  totalRounds = 4,
  disabled = false,
}) {
  return (
    <div className="passface-round">
      <div className="round-indicator">
        <span className="round-badge">
          Round {roundNumber} of {totalRounds}
        </span>
        <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select the image you chose during registration
        </p>
      </div>

      <div className="passfaces-grid">
        {images.map((img) => (
          <div
            key={img.id}
            className={`passface-item ${selectedId === img.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSelect?.(img.id)}
          >
            <img
              src={`http://localhost:8000${img.url}`}
              alt={`Face ${img.id}`}
              loading="lazy"
            />
          </div>
        ))}
      </div>

      <style>{`
        .passface-round {
          animation: slideUp 0.4s ease-out;
        }
        .passface-item.disabled {
          pointer-events: none;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
