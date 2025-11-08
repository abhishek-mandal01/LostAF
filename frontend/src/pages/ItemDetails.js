import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '@/App';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ItemDetails = ({ user, setUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${id}`);
      setItem(response.data);
    } catch (error) {
      console.error('Error fetching item:', error);
      toast.error('Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkResolved = async () => {
    try {
      await api.patch(`/items/${id}/status`, null, {
        params: { status: 'resolved' }
      });
      toast.success('Item marked as resolved');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
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

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!item) {
    return <div>Item not found</div>;
  }

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
        <Button onClick={() => navigate('/dashboard')} variant="ghost" style={{marginBottom: '1rem'}} data-testid="back-button">
          <i className="lucide lucide-arrow-left"></i> Back to Dashboard
        </Button>

        <div className="detail-grid">
          {/* Main Item Card */}
          <div className="card">
            <span className={`item-type-badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}`} data-testid="item-type-badge">
              {item.type === 'lost' ? 'LOST' : 'FOUND'}
            </span>
            {item.status === 'resolved' && (
              <span className="status-badge" data-testid="resolved-badge">✔️ Resolved</span>
            )}
            
            {item.image_url && (
              <img src={item.image_url} alt={item.title} className="detail-image" data-testid="item-image" />
            )}

            <h1 className="detail-title" data-testid="item-title">{item.title}</h1>
            
            <div className="detail-info-grid">
              <div className="detail-info-item">
                <i className="lucide lucide-tag"></i>
                <div>
                  <div className="info-label">Category</div>
                  <div className="info-value" data-testid="item-category">{item.category}</div>
                </div>
              </div>
              <div className="detail-info-item">
                <i className="lucide lucide-map-pin"></i>
                <div>
                  <div className="info-label">Location</div>
                  <div className="info-value" data-testid="item-location">{item.location}</div>
                </div>
              </div>
              <div className="detail-info-item">
                <i className="lucide lucide-calendar"></i>
                <div>
                  <div className="info-label">Date</div>
                  <div className="info-value" data-testid="item-date">{item.date}</div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Description</h3>
              <p data-testid="item-description">{item.description}</p>
            </div>

            <div className="detail-section">
              <h3>Contact Information</h3>
              {item.is_anonymous ? (
                <p data-testid="anonymous-message">This post was made anonymously. Contact information is not available.</p>
              ) : (
                <div>
                  <p><strong>Name:</strong> <span data-testid="item-user-name">{item.user_name}</span></p>
                  <p><strong>Email:</strong> <a href={`mailto:${item.user_email}`} data-testid="item-user-email">{item.user_email}</a></p>
                </div>
              )}
            </div>

            {item.user_id === user.id && item.status === 'active' && (
              <Button onClick={handleMarkResolved} data-testid="mark-resolved-button">
                Mark as Resolved
              </Button>
            )}
          </div>

          {/* Potential Matches */}
          {item.matches && item.matches.length > 0 && (
            <div className="card">
              <h2 data-testid="matches-title">🎯 Potential Matches ({item.matches.length})</h2>
              <p style={{color: '#718096', marginBottom: '1rem'}}>AI found these similar items</p>
              
              <div className="matches-list" data-testid="matches-list">
                {item.matches.map(match => (
                  <div key={match.id} className="match-item" onClick={() => navigate(`/item/${match.id}`)} data-testid={`match-item-${match.id}`}>
                    {match.image_url && (
                      <img src={match.image_url} alt={match.title} className="match-image" />
                    )}
                    <div className="match-content">
                      <h4 data-testid={`match-title-${match.id}`}>{match.title}</h4>
                      <p data-testid={`match-category-${match.id}`}>{match.category} • {match.location}</p>
                      <div className="similarity-bar">
                        <div className="similarity-fill" style={{width: `${match.similarity * 100}%`}}></div>
                      </div>
                      <p className="similarity-text" data-testid={`match-similarity-${match.id}`}>{Math.round(match.similarity * 100)}% Match</p>
                      {match.user_email && (
                        <a href={`mailto:${match.user_email}`} onClick={(e) => e.stopPropagation()} data-testid={`match-email-${match.id}`}>
                          Contact: {match.user_email}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .detail-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
        }

        .detail-image {
          width: 100%;
          max-height: 400px;
          object-fit: cover;
          border-radius: 12px;
          margin: 1rem 0;
        }

        .detail-title {
          font-size: 2rem;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 1.5rem;
        }

        .detail-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .detail-info-item {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .detail-info-item i {
          color: #667eea;
          font-size: 1.5rem;
        }

        .info-label {
          color: #718096;
          font-size: 0.9rem;
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-weight: 600;
          color: #2d3748;
        }

        .detail-section {
          margin-bottom: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e2e8f0;
        }

        .detail-section h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #2d3748;
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #c6f6d5;
          color: #22543d;
          border-radius: 20px;
          font-weight: 600;
          margin-left: 1rem;
        }

        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .match-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f7fafc;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .match-item:hover {
          background: #edf2f7;
        }

        .match-image {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
        }

        .match-content {
          flex: 1;
        }

        .match-content h4 {
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #2d3748;
        }

        .match-content p {
          color: #718096;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .similarity-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin: 0.5rem 0;
        }

        .similarity-fill {
          height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s;
        }

        .similarity-text {
          font-size: 0.85rem;
          font-weight: 600;
          color: #667eea;
        }

        @media (max-width: 1024px) {
          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ItemDetails;
