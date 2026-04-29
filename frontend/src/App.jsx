import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import CCPRegister from './pages/ccp/CCPRegister';
import CCPLogin from './pages/ccp/CCPLogin';
import PassFacesRegister from './pages/passfaces/PassFacesRegister';
import PassFacesLogin from './pages/passfaces/PassFacesLogin';
import GridDrawRegister from './pages/grid-draw/GridDrawRegister';
import GridDrawLogin from './pages/grid-draw/GridDrawLogin';
import ClickPointRegister from './pages/click-point/ClickPointRegister';
import ClickPointLogin from './pages/click-point/ClickPointLogin';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />

          {/* CCP */}
          <Route path="/ccp/register" element={<CCPRegister />} />
          <Route path="/ccp/login" element={<CCPLogin />} />

          {/* PassFaces */}
          <Route path="/passfaces/register" element={<PassFacesRegister />} />
          <Route path="/passfaces/login" element={<PassFacesLogin />} />

          {/* Grid Draw */}
          <Route path="/grid-draw/register" element={<GridDrawRegister />} />
          <Route path="/grid-draw/login" element={<GridDrawLogin />} />

          {/* Click-Point */}
          <Route path="/click-point/register" element={<ClickPointRegister />} />
          <Route path="/click-point/login" element={<ClickPointLogin />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
