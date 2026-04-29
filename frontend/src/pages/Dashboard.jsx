import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [methods, setMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [methodError, setMethodError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const methodLabels = {
    ccp: 'Cued Click Points',
    passfaces: 'PassFaces',
    grid_draw: 'Grid Draw',
    click_point: 'Click Point',
  };

  useEffect(() => {
    let isActive = true;
    const loadMethods = async () => {
      setLoadingMethods(true);
      setMethodError('');
      try {
        const res = await API.get('/api/methods');
        if (isActive) {
          setMethods(res.data.methods || []);
        }
      } catch (err) {
        if (isActive) {
          setMethodError(err.response?.data?.detail || 'Failed to load methods');
        }
      } finally {
        if (isActive) {
          setLoadingMethods(false);
        }
      }
    };

    loadMethods();
    return () => { isActive = false; };
  }, []);

  const handleDeleteMethod = async (method) => {
    try {
      const res = await API.delete(`/api/methods/${method}`);
      const remaining = res.data.remaining_methods || [];
      setMethods(remaining);
      if (user?.authMethod === method) {
        handleLogout();
      }
    } catch (err) {
      setMethodError(err.response?.data?.detail || 'Failed to delete method');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="animated-bg" />
      <div className="page-content">
        <div className="auth-layout">
          <div className="glass-card dashboard-welcome animate-slideUp">
            <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h1>Welcome!</h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginTop: '0.5rem', wordBreak: 'break-all' }}>
              {user?.email}
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Successfully authenticated via graphical password
            </p>

            <div className="dashboard-info">
              <div className="glass-card info-card">
                <div className="info-label">Auth Method</div>
                <div className="info-value">
                  {methodLabels[user?.authMethod] || user?.authMethod}
                </div>
              </div>
              <div className="glass-card info-card">
                <div className="info-label">Session</div>
                <div className="info-value">
                  <span className="badge badge-success">Active</span>
                </div>
              </div>
              <div className="glass-card info-card">
                <div className="info-label">Expiry</div>
                <div className="info-value">60 min</div>
              </div>
            </div>

            <div className="glass-card" style={{ marginTop: '2rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>Your Methods</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Manage or remove any graphical password method
                  </p>
                </div>
                {loadingMethods && (
                  <span className="badge badge-secondary">Loading...</span>
                )}
              </div>

              {methodError && <div className="alert alert-error mb-md">{methodError}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {methods.length === 0 && !loadingMethods && (
                  <div style={{ color: 'var(--text-muted)' }}>No methods found.</div>
                )}
                {methods.map((method) => (
                  <div key={method} className="glass-card" style={{ padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
                      {methodLabels[method] || method}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                      {user?.authMethod === method ? 'Currently active' : 'Available'}
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteMethod(method)}
                    >
                      Delete Method
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => navigate('/')}>
                🏠 Home
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
