import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🔐</span>
          <span className="logo-text">Graph<span className="text-gradient">Auth</span></span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <span className="nav-user">
                <span className="nav-avatar">{user?.email?.[0]?.toUpperCase()}</span>
                {user?.email}
              </span>
              <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/" className="nav-link">Home</Link>
          )}
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(10, 14, 26, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color);
          height: 70px;
        }
        .navbar-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          text-decoration: none;
        }
        .logo-icon { font-size: 1.5rem; }
        .logo-text { letter-spacing: -0.02em; }
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .nav-link {
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 500;
          transition: color var(--transition-fast);
          text-decoration: none;
        }
        .nav-link:hover { color: var(--text-primary); }
        .nav-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--gradient-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }
      `}</style>
    </nav>
  );
}
