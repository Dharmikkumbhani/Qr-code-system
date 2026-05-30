import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Loader2, AlertCircle, QrCode, Share2, Download,
  Copy, Check, Plus, Trash2, ArrowLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function RestaurantQRCodes() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [addingCount, setAddingCount] = useState('1');
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch restaurants to get the specific one (or a dedicated endpoint if it exists)
      const resRest = await api.get('/restaurants');
      const found = resRest.data.data.find(r => r.id === id);
      if (found) setRestaurant(found);

      const resTables = await api.get(`/restaurants/${id}/tables`);
      setTables(resTables.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load QR codes.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTables = async () => {
    const count = parseInt(addingCount);
    if (!count || count < 1) return;
    setIsAdding(true);
    try {
      await api.post(`/restaurants/${id}/tables`, { count });
      await fetchData();
      setAddingCount('1');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add tables');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return;
    try {
      await api.delete(`/restaurants/${id}/tables/${tableId}`);
      setTables(tables.filter(t => t.id !== tableId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete table.');
    }
  };

  const tableUrl = (t) => `http://localhost:5175${t.qrCodeUrl}?t=${t.id}`;

  const downloadQr = (table, index) => {
    const svg = document.getElementById(`qr-svg-${index}`);
    const data = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `${restaurant?.slug}-${table.tableNumber}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  };

  const copyLink = (t) => {
    navigator.clipboard.writeText(tableUrl(t)).then(() => {
      setCopied(t.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loading) {
    return (
      <div className="state-box">
        <Loader2 size={30} className="spin" style={{ color: 'var(--primary)' }} />
        <p>Loading QR codes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="state-box">
        <AlertCircle size={30} style={{ color: 'var(--danger)' }} />
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div style={s.pageHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/restaurants" className="btn-icon">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 style={s.pageTitle}>{restaurant?.name} - QR Codes</h2>
            <p style={s.pageSub}>Manage tables and print QR codes.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="number"
            min="1"
            max="50"
            className="form-input"
            value={addingCount}
            onChange={e => setAddingCount(e.target.value)}
            style={{ width: '70px', textAlign: 'center' }}
          />
          <button className="btn btn-primary" onClick={handleAddTables} disabled={isAdding}>
            {isAdding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Add Tables
          </button>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="state-box" style={{ marginTop: '20px' }}>
          <QrCode size={40} style={{ color: 'var(--text-muted)' }} />
          <h3>No tables yet</h3>
          <p>Add some tables to generate QR codes.</p>
        </div>
      ) : (
        <div style={s.grid}>
          {tables.map((t, index) => (
            <div key={t.id} style={s.qrCard}>
              <div style={s.cardHeader}>
                <span style={s.tableNum}>{t.tableNumber}</span>
                <button className="btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDeleteTable(t.id)} title="Delete Table">
                  <Trash2 size={16} />
                </button>
              </div>

              <div style={s.qrWrapper}>
                <QRCodeSVG
                  id={`qr-svg-${index}`}
                  value={tableUrl(t)}
                  size={160}
                  level="H"
                  includeMargin
                />
              </div>

              <div style={s.actions}>
                <button className="btn btn-secondary" style={s.actionBtn} onClick={() => copyLink(t)}>
                  {copied === t.id ? <Check size={14} /> : <Copy size={14} />} Link
                </button>
                <button className="btn btn-primary" style={s.actionBtn} onClick={() => downloadQr(t, index)}>
                  <Download size={14} /> Save
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  pageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' },
  pageSub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' },
  
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '20px'
  },
  qrCard: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: 'var(--shadow-sm)'
  },
  cardHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  tableNum: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' },
  qrWrapper: {
    background: '#fff',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    marginBottom: '16px'
  },
  actions: {
    display: 'flex',
    gap: '8px',
    width: '100%'
  },
  actionBtn: {
    flex: 1,
    padding: '8px',
    fontSize: '0.8rem',
    justifyContent: 'center'
  }
};
