import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import CanvasClickArea from '../../components/CanvasClickArea';
import { useAuth } from '../../context/AuthContext';

export default function CCPRegister() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(isAuthenticated && user?.email ? 2 : 1);
  const [email, setEmail] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [clicks, setClicks] = useState([]);
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
    if (clicks.length < 3) {
      setError('Please select at least 3 click points');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('email', activeEmail);
      formData.append('image', imageFile);
      formData.append('clicks', JSON.stringify(clicks));

      await API.post('/api/ccp/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/ccp/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Email' },
    { num: 2, label: 'Image' },
    { num: 3, label: 'Click Points' },
    { num: 4, label: 'Confirm' },
  ];

  return (
    <div className="page-wrapper">
      <div className="animated-bg" />
      <div className="page-content">
        <div className="auth-layout animate-slideUp">
          <div className="glass-card auth-card">
            <div className="auth-header">
              <h2>🎯 CCP Registration</h2>
              <p>Select 3–6 points on your image to create your graphical password</p>
            </div>

            {/* Steps */}
            <div className="steps-indicator">
              {steps.map((s, i) => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {i > 0 && <div className="step-connector" />}
                  <div className={`step ${step === s.num ? 'active' : step > s.num ? 'completed' : ''}`}>
                    <div className="step-number">{step > s.num ? '✓' : s.num}</div>
                    <span className="step-label">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

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
                <label className="form-label">Upload Your Image</label>
                <input
                  className="form-input form-input-file"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <button className="btn btn-secondary mt-md" onClick={() => setStep(1)}>
                  ← Back
                </button>
              </div>
            )}

            {step === 3 && imagePreview && (
              <div>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Click 3–6 specific points on your image. Remember their positions!
                </p>
                <CanvasClickArea
                  imageSrc={imagePreview}
                  maxClicks={6}
                  minClicks={3}
                  onClicksChange={setClicks}
                />
                <div className="auth-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(2)}>← Back</button>
                  <button
                    className="btn btn-primary"
                    disabled={clicks.length < 3}
                    onClick={() => setStep(4)}
                  >
                    Confirm Points →
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  You selected <strong style={{ color: 'var(--accent-primary)' }}>{clicks.length}</strong> click points.
                  Review and confirm to register.
                </p>
                <CanvasClickArea
                  imageSrc={imagePreview}
                  maxClicks={clicks.length}
                  existingClicks={clicks}
                  readOnly
                />
                <div className="auth-actions">
                  <button className="btn btn-secondary" onClick={() => setStep(3)}>← Redo</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? '⏳ Registering...' : '✓ Register'}
                  </button>
                </div>
              </div>
            )}

            <div className="auth-footer">
              Already registered? <Link to="/ccp/login">Login with CCP</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
