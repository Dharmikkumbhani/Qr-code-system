import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Store, Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    phone: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: ''
  });

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/restaurants');
      setRestaurants(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurants. Make sure you are a Super Admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Auto-generate slug from name if slug is untouched
    if (e.target.name === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);
    setIsSubmitting(true);

    try {
      await api.post('/restaurants', formData);
      setFormSuccess(true);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormData({ name: '', slug: '', phone: '', address: '', ownerName: '', ownerEmail: '', ownerPassword: '' });
        setFormSuccess(false);
        fetchRestaurants();
      }, 1500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="restaurants-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Restaurants Management</h1>
          <p className="page-subtitle">View and onboard new restaurants.</p>
        </div>
        <button className="primary-btn" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Add Restaurant</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="content-card">
        {isLoading ? (
          <div className="loading-state">
            <Loader2 size={32} className="spin text-primary" />
            <p>Loading restaurants...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <p>{error}</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="empty-state">
            <Store size={48} className="text-secondary" />
            <h3>No Restaurants Yet</h3>
            <p>Get started by adding your first restaurant to the platform.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Slug URL</th>
                  <th>Owner</th>
                  <th>Tables</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((rest) => (
                  <tr key={rest.id}>
                    <td>
                      <div className="rest-name">{rest.name}</div>
                      <div className="rest-phone">{rest.phone}</div>
                    </td>
                    <td className="monospace">/{rest.slug}</td>
                    <td>
                      <div>{rest.owner?.name}</div>
                      <div className="text-sm text-secondary">{rest.owner?.email}</div>
                    </td>
                    <td>{rest._count?.tables || 0}</td>
                    <td>
                      <span className={`badge ${rest.subscriptionStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {rest.subscriptionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Restaurant Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Restaurant</h2>
              <button className="close-btn" onClick={() => !isSubmitting && setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              {formError && (
                <div className="alert alert-error">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
              {formSuccess && (
                <div className="alert alert-success">
                  <CheckCircle2 size={16} /> Restaurant created successfully!
                </div>
              )}

              <div className="form-grid">
                {/* Restaurant Details */}
                <div className="form-section">
                  <h3>Restaurant Details</h3>
                  <div className="input-group">
                    <label>Restaurant Name *</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>Slug (URL) *</label>
                    <input name="slug" value={formData.slug} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>Phone Number</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Address</label>
                    <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2}></textarea>
                  </div>
                </div>

                {/* Owner Details */}
                <div className="form-section">
                  <h3>Owner Credentials</h3>
                  <p className="section-hint">We will create this owner account automatically.</p>
                  <div className="input-group">
                    <label>Owner Name</label>
                    <input name="ownerName" value={formData.ownerName} onChange={handleInputChange} />
                  </div>
                  <div className="input-group">
                    <label>Owner Email *</label>
                    <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleInputChange} required />
                  </div>
                  <div className="input-group">
                    <label>Owner Password *</label>
                    <input type="password" name="ownerPassword" value={formData.ownerPassword} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scoped CSS styling */}
      <style>
        {`
          .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
          }
          .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
          .page-subtitle { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem; }
          
          .primary-btn, .btn-primary {
            display: flex; align-items: center; gap: 0.5rem;
            background: var(--primary-color); color: #fff;
            padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500;
            border: none; cursor: pointer; transition: background 0.2s;
          }
          .primary-btn:hover, .btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
          .btn-secondary {
            padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500;
            background: transparent; border: 1px solid var(--border-color);
            color: var(--text-primary); cursor: pointer;
          }
          
          .content-card {
            background: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
          }

          /* States */
          .loading-state, .error-state, .empty-state {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 4rem 2rem; text-align: center; color: var(--text-secondary);
          }
          .error-state { color: var(--danger-color); }
          .empty-state h3 { color: var(--text-primary); margin: 1rem 0 0.5rem; }
          .spin { animation: spin 1s linear infinite; }

          /* Table */
          .table-responsive { overflow-x: auto; }
          .data-table { width: 100%; border-collapse: collapse; text-align: left; }
          .data-table th { 
            padding: 1rem 1.5rem; font-weight: 600; font-size: 0.875rem;
            color: var(--text-secondary); border-bottom: 1px solid var(--border-color);
            background: rgba(0,0,0,0.1);
          }
          .data-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; }
          .data-table tr:hover { background: rgba(255,255,255,0.02); }
          
          .rest-name { font-weight: 600; color: var(--text-primary); }
          .monospace { font-family: monospace; color: var(--primary-color); }
          .text-sm { font-size: 0.75rem; }
          .text-secondary { color: var(--text-secondary); }
          .text-primary { color: var(--primary-color); }

          .badge { padding: 0.25rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
          .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
          .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }

          /* Modal */
          .modal-overlay {
            position: fixed; inset: 0; z-index: 100;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; padding: 1rem;
          }
          .modal-content {
            background: var(--surface-color); border: 1px solid var(--border-color);
            border-radius: 12px; width: 100%; max-width: 700px;
            max-height: 90vh; display: flex; flex-direction: column;
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);
          }
          .modal-header {
            padding: 1.5rem; border-bottom: 1px solid var(--border-color);
            display: flex; justify-content: space-between; align-items: center;
          }
          .modal-header h2 { font-size: 1.25rem; font-weight: 600; }
          .close-btn { color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
          .close-btn:hover { color: var(--text-primary); }
          
          .modal-body { padding: 1.5rem; overflow-y: auto; }
          .form-grid { display: grid; gap: 2rem; grid-template-columns: 1fr; }
          @media (min-width: 640px) { .form-grid { grid-template-columns: 1fr 1fr; } }
          
          .form-section h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
          .section-hint { font-size: 0.75rem; color: var(--text-secondary); margin-top: -0.5rem; margin-bottom: 1rem; }
          
          .input-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
          .input-group label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); }
          .input-group input, .input-group textarea {
            padding: 0.6rem; border-radius: 6px; border: 1px solid var(--border-color);
            background: var(--bg-color); color: var(--text-primary); outline: none;
          }
          .input-group input:focus, .input-group textarea:focus { border-color: var(--primary-color); }
          
          .modal-footer {
            padding: 1.5rem; border-top: 1px solid var(--border-color);
            display: flex; justify-content: flex-end; gap: 1rem; background: rgba(0,0,0,0.1);
          }

          .alert { padding: 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 1.5rem; }
          .alert-error { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); border: 1px solid rgba(239, 68, 68, 0.2); }
          .alert-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2); }
        `}
      </style>
    </div>
  );
};

export default Restaurants;
