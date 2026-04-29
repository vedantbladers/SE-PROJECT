import { Link } from 'react-router-dom';

const METHOD_DATA = {
  ccp: {
    icon: '🎯',
    color: '#6366f1',
    title: 'Cued Click Points',
    description: 'Click specific points on sequential images. Each click cues the next image in a secure chain.',
    features: ['3-6 click points', 'Multi-image cuing', 'SHA-256 hashed'],
  },
  passfaces: {
    icon: '👤',
    color: '#8b5cf6',
    title: 'PassFaces',
    description: 'Recognize your secret faces from grids of decoys across multiple challenge rounds.',
    features: ['Recognition-based', '4 challenge rounds', 'Shoulder-surf resistant'],
  },
  'grid-draw': {
    icon: '✏️',
    color: '#a78bfa',
    title: 'Grid Draw',
    description: 'Draw a secret pattern by connecting nodes on an 8×8 grid overlaid on your image.',
    features: ['Pattern-based', '8×8 grid overlay', 'Visual path memory'],
  },
  'click-point': {
    icon: '📍',
    color: '#c084fc',
    title: 'Click Point',
    description: 'Select precise points on a single image. Uses fuzzy tolerance for natural human input.',
    features: ['High precision', '5% error tolerance', 'Dual verification'],
  },
};

export default function MethodCard({ method }) {
  const data = METHOD_DATA[method];
  if (!data) return null;

  return (
    <div className="method-card glass-card" style={{ '--card-accent': data.color }}>
      <div className="method-icon">{data.icon}</div>
      <h3 className="method-title">{data.title}</h3>
      <p className="method-desc">{data.description}</p>
      <ul className="method-features">
        {data.features.map((f, i) => (
          <li key={i}><span className="feature-dot" />  {f}</li>
        ))}
      </ul>
      <div className="method-actions">
        <Link to={`/${method}/register`} className="btn btn-primary btn-sm">Register</Link>
        <Link to={`/${method}/login`} className="btn btn-secondary btn-sm">Login</Link>
      </div>

      <style>{`
        .method-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
        }
        .method-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--card-accent);
          opacity: 0;
          transition: opacity var(--transition-base);
        }
        .method-card:hover::before { opacity: 1; }
        .method-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.05);
          border-radius: var(--radius-md);
        }
        .method-title {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .method-desc {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          flex: 1;
        }
        .method-features {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding: 0;
        }
        .method-features li {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: rgba(255,255,255,0.03);
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-color);
        }
        .feature-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--card-accent);
        }
        .method-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .method-actions .btn { flex: 1; }
      `}</style>
    </div>
  );
}
