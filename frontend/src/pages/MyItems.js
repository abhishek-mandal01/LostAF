import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/App';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const MyItems = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyItems();
  }, []);

  const fetchMyItems = async () => {
    try {
      const response = await api.get('/items/user/my-items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load your items');
    } finally {
      setLoading(false);
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
            <Link to="/my-items" className="nav-link active" data-testid="nav-my-items">My Items</Link>
            <Link to="/admin" className="nav-link" data-testid="nav-admin">Admin</Link>
          </div>
          <div className="user-menu">
            <img src={user.picture} alt={user.name} className="user-avatar" data-testid="user-avatar" />
            <Button onClick={handleLogout} variant="outline" size="sm" data-testid="logout-button">Logout</Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        <div className="page-header">
          <h1 className="page-title" data-testid="my-items-title">My Items</h1>
          <Button onClick={() => navigate('/post')} size="lg" data-testid="post-item-button">
            <i className="lucide lucide-plus"></i> Post Item
          </Button>
        </div>

        {loading ? (
          <div className="loading-state" data-testid="loading-state">
            <div className="loader"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <h3>No items posted yet</h3>
            <p>Start by posting a lost or found item!</p>
          </div>
        ) : (
          <div className="items-grid" data-testid="items-grid">
            {items.map(item => (
              <div
                key={item.id}
                className="item-card"
                onClick={() => navigate(`/item/${item.id}`)}
                data-testid={`item-card-${item.id}`}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} className="item-image" />
                ) : (
                  <div className="item-image" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem'}}>
                    {item.type === 'lost' ? '🔍' : '✨'}
                  </div>
                )}
                <div className="item-content">
                  <span className={`item-type-badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`} data-testid={`item-type-${item.id}`}>
                    {item.type === 'lost' ? 'LOST' : 'FOUND'}
                  </span>
                  {item.status === 'resolved' && (
                    <span className="status-badge" data-testid={`resolved-badge-${item.id}`}>✔️ Resolved</span>
                  )}
                  <h3 className="item-title" data-testid={`item-title-${item.id}`}>{item.title}</h3>
                  <p style={{color: '#718096', marginBottom: '0.5rem'}}>{item.description.substring(0, 100)}...</p>
                  <div className="item-info">
                    <div className="item-info-item">
                      <i className="lucide lucide-tag"></i>
                      <span>{item.category}</span>
                    </div>
                    <div className="item-info-item">
                      <i className="lucide lucide-map-pin"></i>
                      <span>{item.location}</span>
                    </div>
                    <div className="item-info-item">
                      <i className="lucide lucide-calendar"></i>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
        }

        .loading-state {
          display: flex;
          justify-content: center;
          padding: 4rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: #c6f6d5;
          color: #22543d;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-left: 0.5rem;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .navbar-links {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MyItems;
