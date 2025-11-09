import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/App';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_lost: 0,
    total_found: 0,
    total_resolved: 0,
    total_matches: 0
  });
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchLocations();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const resp = await api.get('/locations');
      setLocations(resp.data || []);
    } catch (err) {
      console.error('Failed to fetch locations', err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <Link to="/dashboard" className="navbar-brand" data-testid="navbar-brand">LostAF</Link>
          <div className="navbar-links">
            <Link to="/dashboard" className="nav-link" data-testid="nav-dashboard">Dashboard</Link>
            <Link to="/post" className="nav-link" data-testid="nav-post-item">Post Item</Link>
            <Link to="/my-items" className="nav-link" data-testid="nav-my-items">My Items</Link>
            <Link to="/admin" className="nav-link active" data-testid="nav-admin">Admin</Link>
          </div>
          <div className="user-menu">
            <img src={user.picture} alt={user.name} className="user-avatar" data-testid="user-avatar" />
            <Button onClick={handleLogout} variant="outline" size="sm" data-testid="logout-button">Logout</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <h1 className="page-title" data-testid="admin-title">Admin Dashboard</h1>
        <p style={{color: '#718096', marginBottom: '2rem'}}>Overview of LostAF portal statistics</p>

        {loading ? (
          <div className="loading-state" data-testid="loading-state">
            <div className="loader"></div>
          </div>
        ) : (
          <div className="stats-grid" data-testid="stats-grid">
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
              <div className="stat-icon">🔍</div>
              <div className="stat-label">Active Lost Items</div>
              <div className="stat-value" data-testid="total-lost">{stats.total_lost}</div>
            </div>
            
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
              <div className="stat-icon">✨</div>
              <div className="stat-label">Active Found Items</div>
              <div className="stat-value" data-testid="total-found">{stats.total_found}</div>
            </div>
            
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white'}}>
              <div className="stat-icon">✔️</div>
              <div className="stat-label">Resolved Cases</div>
              <div className="stat-value" data-testid="total-resolved">{stats.total_resolved}</div>
            </div>
            
            <div className="stat-card" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white'}}>
              <div className="stat-icon">🎯</div>
              <div className="stat-label">AI Matches Found</div>
              <div className="stat-value" data-testid="total-matches">{stats.total_matches}</div>
            </div>
          </div>
        )}

        <div className="card" style={{marginTop: '2rem'}}>
          <h2>Quick Actions</h2>
          <div style={{display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap'}}>
            <Button onClick={() => navigate('/dashboard')} data-testid="view-all-items-button">
              View All Items
            </Button>
            <Button onClick={() => navigate('/post')} variant="outline" data-testid="post-new-item-button">
              Post New Item
            </Button>
          </div>
        </div>

        <div className="card" style={{marginTop: '2rem'}}>
          <h2>About LostAF</h2>
          <p style={{marginTop: '1rem', lineHeight: '1.6', color: '#4a5568'}}>
            LostAF is an AI-powered lost and found portal designed for CVRU campus. The system uses CLIP-based image similarity 
            to automatically match lost and found items, helping students recover their belongings faster. Email notifications 
            are sent when potential matches are found.
          </p>
        </div>

        <div className="card" style={{marginTop: '2rem'}}>
          <h2>QR Codes for Locations</h2>
          <p style={{color: '#718096', marginBottom: '1rem'}}>Scan to view lost items for a location on the portal</p>
          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
            {locations.map(loc => (
              <div key={loc.location} style={{textAlign: 'center', width: '180px', padding: '0.5rem', borderRadius: '8px', background: '#fff'}}>
                <div style={{fontWeight: 600, marginBottom: '0.5rem'}}>{loc.location}</div>
                {/* Resolve backend URL at runtime if env not embedded */}
                <img src={`${(process.env.REACT_APP_BACKEND_URL || window.location.origin)}/api/qr?location=${encodeURIComponent(loc.location)}`} alt={`QR ${loc.location}`} style={{width: '140px', height: '140px'}} />
                <div style={{fontSize: '0.9rem', color:'#4a5568', marginTop: '0.5rem'}}>Active: {loc.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 0.5rem;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          padding: 4rem;
        }

        .stat-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .stat-card {
          text-align: center;
        }

        .stat-label {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 3rem;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .navbar-links {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
