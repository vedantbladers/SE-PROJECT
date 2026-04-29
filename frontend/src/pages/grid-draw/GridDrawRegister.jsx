import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import GridOverlay from '../../components/GridOverlay';
import { useAuth } from '../../context/AuthContext';

export default function GridDrawRegister() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(isAuthenticated && user?.email ? 2 : 1);
  const [email, setEmail] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pattern, setPattern] = useState([]);
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (pattern.length < 4) {
      setError('Pattern must have at least 4 nodes');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('email', activeEmail);
      formData.append('image', imageFile);
      formData.append('pattern', JSON.stringify(pattern));

      await API.post('/api/grid-draw/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/grid-draw/login'), 2000);
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
        <div className="auth-layout animate-slideUp">
          <div className="glass-card auth-card">
            <div className="auth-header">
              <h2>✏️ Grid Draw Registration</h2>
              <p>Draw a secret pattern by clicking nodes on the grid overlay</p>
            </div>

            {error && <div className="alert alert-error mb-md">{error}</div>}
            {success && <div className="alert alert-success mb-md">{success}</div>}

            {step === 1 && !isAuthenticated && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Enter your email (e.g. user@gmail.com)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="btn btn-primary mt-md"
                  disabled={!email.includes('@')}
                  onClick={() => setStep(2)}
                >
                  Next →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="form-group">
                {isAuthenticated && user?.email && (
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Using signed-in email: {user.email}
                  </div>
                )}
                <label className="form-label">Upload Background Image</label>
                <input
                  className="form-input form-input-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <button className="btn btn-secondary mt-md" onClick={() => setStep(1)}>← Back</button>
              </div>
            )}

            {step === 3 && imagePreview && (
              <div>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Click grid nodes to create your pattern. Click a node again to undo from that point.
                </p>
                <GridOverlay
                  imageSrc={imagePreview}
                  onPatternChange={setPattern}
                />
                <div className="auth-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={pattern.length < 4 || loading}
                    onClick={handleSubmit}
                  >
                    {loading ? '⏳ Registering...' : '✓ Register'}
                  </button>
                </div>
              </div>
            )}

            <div className="auth-footer">
              Already registered? <Link to="/grid-draw/login">Login with Grid Draw</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
