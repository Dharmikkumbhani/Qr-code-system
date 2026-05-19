import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Store, Loader2, X, AlertCircle, CheckCircle2, QrCode, ChevronLeft, ChevronRight, Share2, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '', slug: '', phone: '', address: '',
    ownerName: '', ownerEmail: '', ownerPassword: ''
  });

  // QR Generation Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedRest, setSelectedRest] = useState(null);
  const [tables, setTables] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tableCountInput, setTableCountInput] = useState('10');
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/restaurants');
      setRestaurants(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurants.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }));
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess(false); setIsSubmitting(true);
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

  const openQrModal = async (restaurant) => {
    setSelectedRest(restaurant);
    setQrModalOpen(true);
    setActiveSlide(0);
    setTables([]); // Reset
    
    // Fetch existing tables
    try {
      const res = await api.get(`/restaurants/${restaurant.id}/tables`);
      if (res.data.data) {
        setTables(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tables', err);
    }
  };

  const handleGenerateTables = async () => {
    if (!selectedRest) return;
    setIsGenerating(true);
    try {
      const res = await api.post(`/restaurants/${selectedRest.id}/tables`, { count: parseInt(tableCountInput) });
      setTables(res.data.data);
      // Update restaurant count locally
      setRestaurants(prev => prev.map(r => r.id === selectedRest.id ? { ...r, _count: { ...r._count, tables: res.data.data.length } } : r));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error generating tables');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQrCode = () => {
    const svg = document.getElementById(`qr-${activeSlide}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `${selectedRest.slug}-${tables[activeSlide].tableNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const shareViaWhatsApp = () => {
    const currentTable = tables[activeSlide];
    // Uses localhost for development testing
    const url = `http://localhost:5173${currentTable.qrCodeUrl}?t=${currentTable.id}`;
    const text = encodeURIComponent(`Here is the QR link for ${currentTable.tableNumber} at ${selectedRest.name}:\n\n${url}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
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
                  <th>Actions</th>
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
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="action-btn" onClick={() => openQrModal(rest)}>
                        <QrCode size={18} /> QR
                      </button>
                      <button className="action-btn" onClick={() => window.location.href=`/restaurants/${rest.id}/menu`}>
                        <Store size={18} /> Menu
                      </button>
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
              <button className="close-btn" onClick={() => !isSubmitting && setIsModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddSubmit} className="modal-body">
              {formError && <div className="alert alert-error"><AlertCircle size={16} /> {formError}</div>}
              {formSuccess && <div className="alert alert-success"><CheckCircle2 size={16} /> Created successfully!</div>}
              <div className="form-grid">
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
                <div className="form-section">
                  <h3>Owner Credentials</h3>
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
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Codes Modal */}
      {qrModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content qr-modal">
            <div className="modal-header">
              <h2>QR Codes: {selectedRest?.name}</h2>
              <button className="close-btn" onClick={() => setQrModalOpen(false)}><X size={20} /></button>
            </div>
            
            <div className="modal-body qr-body">
              {tables.length === 0 ? (
                <div className="generate-state">
                  <QrCode size={48} className="text-secondary mb-1" />
                  <h3>No tables generated yet</h3>
                  <p className="text-secondary mb-2">How many tables does this restaurant have?</p>
                  <div className="generate-actions">
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={tableCountInput} 
                      onChange={e => setTableCountInput(e.target.value)}
                      className="count-input"
                    />
                    <button className="btn-primary" onClick={handleGenerateTables} disabled={isGenerating}>
                      {isGenerating ? <Loader2 size={16} className="spin" /> : 'Generate Now'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="carousel-container">
                  <div className="carousel-nav">
                    <button 
                      className="nav-btn" 
                      onClick={() => setActiveSlide(prev => prev > 0 ? prev - 1 : prev)}
                      disabled={activeSlide === 0}
                    >
                      <ChevronLeft size={24} />
                    </button>
                  </div>
                  
                  <div className="qr-slide">
                    <div className="qr-card">
                      <h3 className="table-title">{tables[activeSlide].tableNumber}</h3>
                      <div className="qr-wrapper">
                        <QRCodeSVG 
                          id={`qr-${activeSlide}`}
                          value={`http://localhost:5173${tables[activeSlide].qrCodeUrl}?t=${tables[activeSlide].id}`} 
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                      <p className="qr-hint">Scan to order at this table</p>
                    </div>

                    <div className="qr-actions">
                      <button className="action-button whatsapp" onClick={shareViaWhatsApp}>
                        <Share2 size={18} /> Share via WhatsApp
                      </button>
                      <button className="action-button download" onClick={downloadQrCode}>
                        <Download size={18} /> Download Image
                      </button>
                    </div>
                  </div>

                  <div className="carousel-nav">
                    <button 
                      className="nav-btn" 
                      onClick={() => setActiveSlide(prev => prev < tables.length - 1 ? prev + 1 : prev)}
                      disabled={activeSlide === tables.length - 1}
                    >
                      <ChevronRight size={24} />
                    </button>
                  </div>
                  
                  <div className="slide-counter">
                    {activeSlide + 1} / {tables.length}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>
        {`
          .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap;}
          .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
          .page-subtitle { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem; }
          .primary-btn, .btn-primary { display: flex; align-items: center; gap: 0.5rem; background: var(--primary-color); color: #fff; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; transition: background 0.2s; }
          .primary-btn:hover, .btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
          .btn-secondary { padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; }
          
          .content-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
          .loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; color: var(--text-secondary); }
          .error-state { color: var(--danger-color); }
          .empty-state h3 { color: var(--text-primary); margin: 1rem 0 0.5rem; }
          .spin { animation: spin 1s linear infinite; }
          
          .table-responsive { overflow-x: auto; }
          .data-table { width: 100%; border-collapse: collapse; text-align: left; }
          .data-table th { padding: 1rem 1.5rem; font-weight: 600; font-size: 0.875rem; color: var(--text-secondary); border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.1); }
          .data-table td { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); font-size: 0.875rem; vertical-align: middle; }
          .data-table tr:hover { background: rgba(255,255,255,0.02); }
          .rest-name { font-weight: 600; color: var(--text-primary); }
          .monospace { font-family: monospace; color: var(--primary-color); }
          .text-sm { font-size: 0.75rem; }
          .text-secondary { color: var(--text-secondary); }
          .text-primary { color: var(--primary-color); }
          .mb-1 { margin-bottom: 0.5rem; }
          .mb-2 { margin-bottom: 1rem; }
          
          .badge { padding: 0.25rem 0.5rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
          .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
          .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
          
          .action-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-primary); font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
          .action-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
          
          /* Modal Setup */
          .modal-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
          .modal-content { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; width: 100%; max-width: 700px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); }
          .qr-modal { max-width: 500px; }
          .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
          .modal-header h2 { font-size: 1.25rem; font-weight: 600; }
          .close-btn { color: var(--text-secondary); cursor: pointer; transition: color 0.2s; }
          .close-btn:hover { color: var(--text-primary); }
          .modal-body { padding: 1.5rem; overflow-y: auto; }
          .qr-body { min-height: 400px; display: flex; flex-direction: column; justify-content: center; }
          
          .generate-state { text-align: center; display: flex; flex-direction: column; align-items: center; }
          .generate-actions { display: flex; gap: 0.5rem; margin-top: 1rem; }
          .count-input { width: 80px; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: white; text-align: center; }
          
          .carousel-container { position: relative; display: flex; align-items: center; justify-content: space-between; width: 100%; height: 100%; }
          .carousel-nav { flex: 0 0 40px; display: flex; justify-content: center; }
          .nav-btn { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-color); border: 1px solid var(--border-color); color: var(--text-primary); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
          .nav-btn:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); }
          .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
          
          .qr-slide { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 1rem; }
          .qr-card { background: white; padding: 2rem; border-radius: 12px; text-align: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 280px; }
          .table-title { color: #1e293b; font-size: 1.5rem; font-weight: 700; margin-bottom: 1.5rem; }
          .qr-wrapper { display: flex; justify-content: center; margin-bottom: 1.5rem; }
          .qr-hint { color: #64748b; font-size: 0.875rem; }
          
          .qr-actions { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 280px; margin-top: 2rem; }
          .action-button { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; font-size: 0.875rem; transition: transform 0.1s; }
          .action-button:active { transform: scale(0.98); }
          .whatsapp { background-color: #25D366; color: white; }
          .whatsapp:hover { background-color: #128C7E; }
          .download { background-color: var(--bg-color); color: var(--text-primary); border: 1px solid var(--border-color); }
          .download:hover { border-color: var(--text-primary); }
          
          .slide-counter { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; }
          
          .form-grid { display: grid; gap: 2rem; grid-template-columns: 1fr; }
          @media (min-width: 640px) { .form-grid { grid-template-columns: 1fr 1fr; } }
          .form-section h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
          .input-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.3rem; }
          .input-group label { font-size: 0.8rem; font-weight: 500; color: var(--text-secondary); }
          .input-group input, .input-group textarea { padding: 0.6rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-primary); outline: none; }
          .input-group input:focus, .input-group textarea:focus { border-color: var(--primary-color); }
          .modal-footer { padding: 1.5rem; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 1rem; background: rgba(0,0,0,0.1); }
          .alert { padding: 0.75rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; margin-bottom: 1.5rem; }
          .alert-error { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); border: 1px solid rgba(239, 68, 68, 0.2); }
          .alert-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); border: 1px solid rgba(16, 185, 129, 0.2); }
        `}
      </style>
    </div>
  );
};

export default Restaurants;
