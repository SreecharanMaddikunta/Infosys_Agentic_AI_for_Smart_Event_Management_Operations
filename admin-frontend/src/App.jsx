import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Sun, Moon, LogOut } from 'lucide-react';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import VenueManagement from './pages/VenueManagement';
import SpeakerManagement from './pages/SpeakerManagement';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import SponsorDashboard from './components/Sponsors/SponsorDashboard';
import IncidentDashboard from './components/Incidents/IncidentDashboard';
import ReportIncidentForm from './components/Incidents/ReportIncidentForm';
import AlertDropdown from './components/Alerts/AlertDropdown';
import Home from './pages/Home';
import AIAgentsDashboard from './pages/AIAgentsDashboard';

// ProtectedRoute component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Navbar Component to use useNavigate
const Navbar = ({ isDark, setIsDark, isAuthenticated, handleLogout }) => {
  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex justify-between items-center mb-8">
      <Link to={isAuthenticated ? "/admin-dashboard" : "/"} className="text-2xl font-bold gradient-text hover:opacity-80 transition">
        Infosys Event Platform
      </Link>
      <div className="flex items-center space-x-6">
        {!isAuthenticated ? (
          <>
            <Link to="/" className="hover:text-primary font-medium transition">Home</Link>
            <Link to="/login" className="hover:text-primary font-medium transition">Login</Link>
          </>
        ) : (
          <>
            <NavLink to="/admin-dashboard" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-primary'}`}>Admin</NavLink>
            <NavLink to="/command-center" className={({ isActive }) => `font-bold transition ${isActive ? 'text-accent border-b-2 border-accent pb-1' : 'text-accent/80 hover:text-accent'}`}>Command Center</NavLink>
            <NavLink to="/ai-agents" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'text-primary/80 hover:text-primary'}`}>AI Agents</NavLink>
            <NavLink to="/venues" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-primary'}`}>Venues</NavLink>
            <NavLink to="/speakers" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-primary'}`}>Speakers</NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-primary'}`}>Analytics</NavLink>
            <NavLink to="/sponsors" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-primary'}`}>Sponsors</NavLink>
            <NavLink to="/incidents" className={({ isActive }) => `font-medium transition ${isActive ? 'text-primary border-b-2 border-primary pb-1' : 'hover:text-primary'}`}>Incidents</NavLink>
            <button 
              onClick={handleLogout} 
              className="text-red-400 hover:text-red-500 font-medium transition flex items-center gap-1"
            >
              <LogOut size={18} /> Logout
            </button>
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            <AlertDropdown />
          </>
        )}
        
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="p-2 rounded-full hover:bg-muted transition"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
        </button>
      </div>
    </nav>
  );
};

function App() {
  const [isDark, setIsDark] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (isAuthenticated && role !== 'ADMIN' && role !== 'SUPERADMIN') {
        handleLogout();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Navbar 
        isDark={isDark} 
        setIsDark={setIsDark} 
        isAuthenticated={isAuthenticated} 
        handleLogout={handleLogout} 
      />
      <main className="container mx-auto px-4 pb-20">
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/admin-dashboard" replace /> : <Home />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/admin-dashboard" replace /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/admin-dashboard" replace /> : <Register />} />
          
          <Route path="/admin-dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/command-center" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ExecutiveDashboard /></ProtectedRoute>} />
          <Route path="/ai-agents" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AIAgentsDashboard /></ProtectedRoute>} />
          <Route path="/venues" element={<ProtectedRoute isAuthenticated={isAuthenticated}><VenueManagement /></ProtectedRoute>} />
          <Route path="/speakers" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SpeakerManagement /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute isAuthenticated={isAuthenticated}><AnalyticsDashboard /></ProtectedRoute>} />
          <Route path="/sponsors" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SponsorDashboard /></ProtectedRoute>} />
          <Route path="/incidents" element={<ProtectedRoute isAuthenticated={isAuthenticated}><IncidentDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Floating Report Issue Modal (Global for authenticated admin) */}
        {isAuthenticated && <ReportIncidentForm />}
      </main>
    </Router>
  );
}

export default App;
