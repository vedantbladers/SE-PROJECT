import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import CanvasClickArea from '../../components/CanvasClickArea';
import { checkLockout, recordFailedAttempt, resetAttempts, formatLockoutTime } from '../../utils/lockout';

export default function ClickPointLogin() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [imageSrc, setImageSrc] = useState(null);
  const [clicks, setClicks] = useState([]);
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
      const res = await API.get(`/api/click-point/image/${encodeURIComponent(activeEmail)}`);
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
    if (clicks.length < 3) {
      setError('Click at least 3 points');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await API.post('/api/click-point/login', { email: activeEmail, clicks });
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
      setClicks([]);
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
              <h2>📍 Click-Point Login</h2>
              <p>Click the same precise points to authenticate</p>
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
                  Click your password points on the image in exact order
                </p>
                <CanvasClickArea
                  imageSrc={imageSrc}
                  maxClicks={5}
                  minClicks={3}
                  onClicksChange={setClicks}
                />
                <div className="auth-actions">
                  <button className="btn btn-secondary" onClick={() => { setStep(1); setClicks([]); }}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={clicks.length < 3 || loading}
                    onClick={handleLogin}
                  >
                    {loading ? '⏳ Verifying...' : '🔓 Authenticate'}
                  </button>
                </div>
              </div>
            )}

            <div className="auth-footer">
              Don't have an account? <Link to="/click-point/register">Register with Click-Point</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
