import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const PostItem = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'lost',
    title: '',
    category: '',
    location: '',
    date: '',
    description: '',
    is_anonymous: false
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const categories = ['ID Card', 'Electronics', 'Books', 'Clothing', 'Accessories', 'Keys', 'Wallet', 'Miscellaneous'];
  const locations = ['Main Block', 'Library', 'Hostel', 'Canteen', 'Sports Complex', 'Auditorium', 'Parking', 'Other'];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.location || !formData.date || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('title', formData.title);
      submitData.append('category', formData.category);
      submitData.append('location', formData.location);
      submitData.append('date', formData.date);
      submitData.append('description', formData.description);
      submitData.append('is_anonymous', formData.is_anonymous);
      
      if (image) {
        submitData.append('image', image);
      }

      await api.post('/items', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Item posted successfully! We\'ll notify you if we find matches.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error posting item:', error);
      toast.error('Failed to post item');
    } finally {
      setSubmitting(false);
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
            <Link to="/post" className="nav-link active" data-testid="nav-post-item">Post Item</Link>
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
        <div className="card" style={{maxWidth: '800px', margin: '0 auto'}}>
          <h1 className="page-title" data-testid="post-item-title">Post Lost or Found Item</h1>
          <p style={{color: '#718096', marginBottom: '2rem'}}>Fill in the details to help others find or return items</p>

          <form onSubmit={handleSubmit}>
            {/* Item Type */}
            <div className="form-group">
              <label className="form-label">Item Type *</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger data-testid="item-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lost">Lost Item</SelectItem>
                  <SelectItem value="found">Found Item</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <Input
                placeholder="e.g., Black Leather Wallet"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                data-testid="title-input"
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label className="form-label">Category *</label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger data-testid="category-select">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="form-group">
              <label className="form-label">Location *</label>
              <Select value={formData.location} onValueChange={(value) => setFormData({...formData, location: value})}>
                <SelectTrigger data-testid="location-select">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Date {formData.type === 'lost' ? 'Lost' : 'Found'} *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                data-testid="date-input"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <Textarea
                placeholder="Provide detailed description to help with identification..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                data-testid="description-textarea"
              />
            </div>

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Upload Image (Optional but recommended for AI matching)</label>
              <div className="image-upload" onClick={() => document.getElementById('image-input').click()} data-testid="image-upload-area">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" data-testid="image-preview" />
                ) : (
                  <div>
                    <i className="lucide lucide-upload" style={{fontSize: '3rem', color: '#cbd5e0'}}></i>
                    <p style={{marginTop: '1rem', color: '#718096'}}>Click to upload image</p>
                  </div>
                )}
              </div>
              <input
                id="image-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{display: 'none'}}
                data-testid="image-input"
              />
            </div>

            {/* Anonymous Posting */}
            <div className="checkbox-group">
              <Checkbox
                id="anonymous"
                checked={formData.is_anonymous}
                onCheckedChange={(checked) => setFormData({...formData, is_anonymous: checked})}
                data-testid="anonymous-checkbox"
              />
              <label htmlFor="anonymous" className="checkbox-label">
                Post anonymously (Your contact info won't be visible)
              </label>
            </div>

            {/* Submit Button */}
            <div style={{marginTop: '2rem', display: 'flex', gap: '1rem'}}>
              <Button type="submit" disabled={submitting} data-testid="submit-button">
                {submitting ? 'Posting...' : 'Post Item'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} data-testid="cancel-button">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostItem;
