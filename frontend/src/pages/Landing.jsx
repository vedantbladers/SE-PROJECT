import MethodCard from '../components/MethodCard';

export default function Landing() {
  return (
    <div className="page-wrapper">
      <div className="animated-bg" />
      <div className="page-content">
        {/* Hero */}
        <div className="hero animate-fadeIn" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔐</div>
          <h1>
            Graphical Password{' '}
            <span className="text-gradient">Authentication</span>
          </h1>
          <p className="section-subtitle" style={{ maxWidth: '650px', margin: '1rem auto 0' }}>
            Say goodbye to text passwords. Choose from 4 cutting-edge graphical
            authentication methods — powered by SHA-256 hashing, JWT sessions,
            and dual-verification security.
          </p>
        </div>

        {/* Method Cards */}
        <div className="methods-grid animate-slideUp">
          <MethodCard method="ccp" />
          <MethodCard method="passfaces" />
          <MethodCard method="grid-draw" />
          <MethodCard method="click-point" />
        </div>

        {/* Security badges */}
        <div className="security-strip animate-fadeIn" style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center',
          marginTop: '3rem',
        }}>
          {['SHA-256 Hashing', 'JWT Sessions', 'Brute-Force Protection', '5% Fuzzy Tolerance', 'UUID Image Storage'].map(tag => (
            <span key={tag} className="badge badge-primary">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
