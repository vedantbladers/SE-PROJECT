import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function PassFacesRegister() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(isAuthenticated && user?.email ? 2 : 1);
  const [email, setEmail] = useState('');
  const [pool, setPool] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const activeEmail = isAuthenticated && user?.email ? user.email : email;

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
      if (step === 1) {
        setStep(2);
      }
    }
  }, [isAuthenticated, user, step]);

  useEffect(() => {
    API.get('/api/passfaces/pool')
      .then(res => setPool(res.data.faces))
      .catch(() => setError('Failed to load face pool'));
  }, []);

  const toggleFace = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length < 4) { setError('Please select at least 4 faces'); return; }
    setLoading(true);
    setError('');
    try {
      await API.post('/api/passfaces/register', { email: activeEmail, selected_face_ids: selectedIds });
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/passfaces/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="animated-bg" />
      <div className="page-content">
        <div className="auth-layout animate-slideUp" style={{ maxWidth: '800px' }}>
          <div className="glass-card auth-card">
            <div className="auth-header">
              <h2>👤 PassFaces Registration</h2>
              <p>Select 4–5 secret faces from the pool. You'll need to recognize them during login.</p>
            </div>

            {error && <div className="alert alert-error mb-md">{error}</div>}
            {success && <div className="alert alert-success mb-md">{success}</div>}

            {step === 1 && !isAuthenticated && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input" type="email"
                  placeholder="Enter your email (e.g. user@gmail.com)"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-primary mt-md" disabled={!email.includes('@')} onClick={() => setStep(2)}>
                  Next →
                </button>
              </div>
            )}

            {step === 2 && (
              <div>
                {isAuthenticated && user?.email && (
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Using signed-in email: {user.email}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="form-label">Select Your Secret Faces ({selectedIds.length}/5)</span>
                  <span className="badge badge-primary">{pool.length} available</span>
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem',
                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                }}>
                  {pool.map(face => (
                    <div key={face.id}
                      className={`passface-item ${selectedIds.includes(face.id) ? 'selected' : ''}`}
                      onClick={() => toggleFace(face.id)}
                      style={{ aspectRatio: '1', borderRadius: '0.5rem' }}
                    >
                      <img src={`http://localhost:8000${face.url}`} alt={`Face ${face.id}`} loading="lazy" />
                    </div>
                  ))}
                </div>
                <div className="auth-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                  <button className="btn btn-primary" disabled={selectedIds.length < 4 || loading} onClick={handleSubmit}>
                    {loading ? '⏳ Registering...' : '✓ Register'}
                  </button>
                </div>
              </div>
            )}

            <div className="auth-footer">
              Already registered? <Link to="/passfaces/login">Login with PassFaces</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
