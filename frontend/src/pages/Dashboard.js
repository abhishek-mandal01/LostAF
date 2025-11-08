import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const Dashboard = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    category: '',
    location: '',
    search: ''
  });

  const categories = ['ID Card', 'Electronics', 'Books', 'Clothing', 'Accessories', 'Keys', 'Wallet', 'Miscellaneous'];
  const locations = ['Main Block', 'Library', 'Hostel', 'Canteen', 'Sports Complex', 'Auditorium', 'Parking', 'Other'];

  useEffect(() => {
    fetchItems();
  }, [filters]);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.location) params.append('location', filters.location);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/items?${params.toString()}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to load items');
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
            <Link to="/dashboard" className="nav-link active" data-testid="nav-dashboard">Dashboard</Link>
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
        <div className="page-header">
          <h1 className="page-title" data-testid="dashboard-title">Lost & Found Items</h1>
          <Button onClick={() => navigate('/post')} size="lg" data-testid="post-item-header-button">
            <i className="lucide lucide-plus"></i> Post Item
          </Button>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-row">
            <Input
              placeholder="Search items..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              data-testid="search-input"
            />
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger data-testid="type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
                <SelectItem value="found">Found</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.location} onValueChange={(value) => setFilters({ ...filters, location: value })}>
              <SelectTrigger data-testid="location-filter">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {locations.map(loc => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items Grid */}
        {loading ? (
          <div className="loading-state" data-testid="loading-state">
            <div className="loader"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state" data-testid="empty-state">
            <h3>No items found</h3>
            <p>Be the first to post a lost or found item!</p>
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
                  {item.matches && item.matches.length > 0 && (
                    <span className="match-badge" data-testid={`match-badge-${item.id}`}>
                      🎯 {item.matches.length} Potential Match(es)
                    </span>
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

export default Dashboard;
