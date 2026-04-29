import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import GridOverlay from '../../components/GridOverlay';
import { checkLockout, recordFailedAttempt, resetAttempts, formatLockoutTime } from '../../utils/lockout';

export default function GridDrawLogin() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [pattern, setPattern] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState({ locked: false, remainingMs: 0 });

  const activeEmail = isAuthenticated && user?.email ? user.email : email;

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  const fetchImage = async () => {
    const lo = checkLockout(activeEmail);
    if (lo.locked) { setLockout(lo); return; }
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/api/grid-draw/image/${encodeURIComponent(activeEmail)}`);
      setImageSrc(`http://localhost:8000${res.data.image_url}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const lo = checkLockout(activeEmail);
    if (lo.locked) { setLockout(lo); return; }
    if (pattern.length < 4) {
      setError('Draw at least 4 nodes');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/grid-draw/login', { email: activeEmail, pattern });
      resetAttempts(activeEmail);
      login(res.data.access_token, res.data.email, res.data.auth_method);
      navigate('/dashboard');
    } catch (err) {
      const result = recordFailedAttempt(activeEmail);
      if (result.locked) {
        setLockout(result);
      } else {
        setError(`Authentication failed. ${5 - result.attempts} attempts remaining.`);
      }
      setPattern([]);
    } finally {
      setLoading(false);
    }
  };

  if (lockout.locked) {
    return (
      <div className="lockout-overlay">
        <div className="lockout-content">
          <div className="lockout-icon">🔒</div>
          <h2>Account Locked</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Too many failed attempts.</p>
          <div className="lockout-timer">{formatLockoutTime(lockout.remainingMs)}</div>
          <button className="btn btn-secondary" onClick={() => {
            setLockout({ locked: false, remainingMs: 0 });
            setStep(1); setError('');
          }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="animated-bg" />
      <div className="page-content">
        <div className="auth-layout animate-slideUp">
          <div className="glass-card auth-card">
            <div className="auth-header">
              <h2>✏️ Grid Draw Login</h2>
              <p>Redraw your secret pattern to authenticate</p>
            </div>

            {error && <div className="alert alert-error mb-md">{error}</div>}

            {step === 1 && (
              <div className="form-group">
                {isAuthenticated && user?.email ? (
                  <>
                    <div className="form-label">Signed in as</div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{user.email}</div>
                    <button className="btn btn-primary mt-md" disabled={loading} onClick={fetchImage}>
                      {loading ? '⏳ Loading...' : 'Continue →'}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="form-label">Email Address</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                      className="btn btn-primary mt-md"
                      disabled={!email.includes('@') || loading}
                      onClick={fetchImage}
                    >
                      {loading ? '⏳ Loading...' : 'Continue →'}
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 2 && imageSrc && (
              <div>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Click the grid nodes in the same order as your registered pattern
                </p>
                <GridOverlay
                  imageSrc={imageSrc}
                  onPatternChange={setPattern}
                />
                <div className="auth-actions">
                  <button className="btn btn-secondary" onClick={() => { setStep(1); setPattern([]); }}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={pattern.length < 4 || loading}
                    onClick={handleLogin}
                  >
                    {loading ? '⏳ Verifying...' : '🔓 Authenticate'}
                  </button>
                </div>
              </div>
            )}

            <div className="auth-footer">
              Don't have an account? <Link to="/grid-draw/register">Register with Grid Draw</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
