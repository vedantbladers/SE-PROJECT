import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PassFaceGrid from '../../components/PassFaceGrid';
import { checkLockout, recordFailedAttempt, resetAttempts, formatLockoutTime } from '../../utils/lockout';

export default function PassFacesLogin() {
  const navigate = useNavigate();
  const { login, user, isAuthenticated } = useAuth();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [selections, setSelections] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockout, setLockout] = useState({ locked: false, remainingMs: 0 });

  const activeEmail = isAuthenticated && user?.email ? user.email : email;

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  const fetchChallenge = async () => {
    const lo = checkLockout(activeEmail);
    if (lo.locked) { setLockout(lo); return; }
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/api/passfaces/challenge/${encodeURIComponent(activeEmail)}`);
      setChallenge(res.data);
      setCurrentRound(0);
      setSelections([]);
      setStep('challenge');
    } catch (err) {
      setError(err.response?.data?.detail || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (faceId) => {
    const newSelections = [...selections, faceId];
    setSelections(newSelections);

    if (currentRound + 1 < challenge.rounds.length) {
      setTimeout(() => setCurrentRound(currentRound + 1), 300);
    } else {
      setLoading(true);
      try {
        const res = await API.post('/api/passfaces/login', { email: activeEmail, round_selections: newSelections });
        resetAttempts(activeEmail);
        login(res.data.access_token, res.data.email, res.data.auth_method);
        navigate('/dashboard');
      } catch (err) {
        const result = recordFailedAttempt(activeEmail);
        if (result.locked) { setLockout(result); }
        else {
          setError(`Authentication failed. ${5 - result.attempts} attempts remaining.`);
          setCurrentRound(0);
          setSelections([]);
          fetchChallenge();
        }
      } finally {
        setLoading(false);
      }
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
          <button className="btn btn-secondary" onClick={() => { setLockout({ locked: false, remainingMs: 0 }); setStep('email'); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="animated-bg" />
      <div className="page-content">
        <div className="auth-layout animate-slideUp" style={{ maxWidth: '600px' }}>
          <div className="glass-card auth-card">
            <div className="auth-header">
              <h2>👤 PassFaces Login</h2>
              <p>Identify your secret faces from each grid</p>
            </div>

            {error && <div className="alert alert-error mb-md">{error}</div>}

            {step === 'email' && (
              <div className="form-group">
                {isAuthenticated && user?.email ? (
                  <>
                    <div className="form-label">Signed in as</div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{user.email}</div>
                    <button className="btn btn-primary mt-md" disabled={loading} onClick={fetchChallenge}>
                      {loading ? '⏳ Loading...' : 'Start Challenge →'}
                    </button>
                  </>
                ) : (
                  <>
                    <label className="form-label">Email Address</label>
                    <input
                      className="form-input" type="email"
                      placeholder="Enter your email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                    />
                    <button className="btn btn-primary mt-md" disabled={!email.includes('@') || loading} onClick={fetchChallenge}>
                      {loading ? '⏳ Loading...' : 'Start Challenge →'}
                    </button>
                  </>
                )}
              </div>
            )}

            {step === 'challenge' && challenge && (
              <PassFaceGrid
                images={challenge.rounds[currentRound]?.images || []}
                onSelect={handleSelect}
                selectedId={null}
                roundNumber={currentRound + 1}
                totalRounds={challenge.rounds.length}
                disabled={loading}
              />
            )}

            <div className="auth-footer">
              Don't have an account? <Link to="/passfaces/register">Register with PassFaces</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
