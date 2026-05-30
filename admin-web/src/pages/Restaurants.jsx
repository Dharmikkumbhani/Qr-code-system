import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Plus, Store, Loader2, X, AlertCircle, CheckCircle2,
  QrCode, ChevronLeft, ChevronRight, Share2, Download,
  Copy, Check, ExternalLink, TableProperties
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');

  /* Add modal */
  const [addOpen, setAddOpen]         = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [form, setForm]               = useState({
    name: '', slug: '', phone: '', address: '',
    ownerName: '', ownerEmail: '', ownerPassword: ''
  });

  /* QR modal */
  const [qrOpen, setQrOpen]           = useState(false);
  const [selRest, setSelRest]         = useState(null);
  const [tables, setTables]           = useState([]);
  const [generating, setGenerating]   = useState(false);
  const [tableCount, setTableCount]   = useState('10');
  const [slide, setSlide]             = useState(0);
  const [copied, setCopied]           = useState(null);

  /* Add Tables modal */
  const [addTablesOpen, setAddTablesOpen]   = useState(false);
  const [addTablesRest, setAddTablesRest]   = useState(null);
  const [addTablesCount, setAddTablesCount] = useState('5');
  const [addTablesLoading, setAddTablesLoading] = useState(false);
  const [addTablesSuccess, setAddTablesSuccess] = useState('');

  /* ── Data fetching ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await api.get('/restaurants');
      setRestaurants(res.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch restaurants.');
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  /* ── Form handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'name') {
      setForm(f => ({ ...f, name: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError(''); setFormSuccess(false); setSubmitting(true);
    try {
      await api.post('/restaurants', form);
      setFormSuccess(true);
      setTimeout(() => {
        setAddOpen(false);
        setForm({ name:'', slug:'', phone:'', address:'', ownerName:'', ownerEmail:'', ownerPassword:'' });
        setFormSuccess(false);
        fetchAll();
      }, 1400);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create restaurant.');
    } finally { setSubmitting(false); }
  };

  /* ── QR handlers ── */
  const openQr = async (rest) => {
    setSelRest(rest); setQrOpen(true); setSlide(0); setTables([]);
    try {
      const res = await api.get(`/restaurants/${rest.id}/tables`);
      setTables(res.data.data || []);
    } catch { /* ignore */ }
  };

  const generateTables = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/restaurants/${selRest.id}/tables`, { count: parseInt(tableCount) });
      setTables(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error generating tables');
    } finally { setGenerating(false); }
  };

  /* ── Add Tables (quick modal) ── */
  const handleAddTables = async () => {
    if (!addTablesRest || !addTablesCount) return;
    setAddTablesLoading(true);
    setAddTablesSuccess('');
    try {
      const res = await api.post(`/restaurants/${addTablesRest.id}/tables`, { count: parseInt(addTablesCount) });
      const newTotal = res.data.data.length;
      // Update table count in the list immediately
      setRestaurants(prev =>
        prev.map(r => r.id === addTablesRest.id
          ? { ...r, _count: { ...r._count, tables: newTotal } }
          : r
        )
      );
      setAddTablesSuccess(`✓ ${newTotal} tables now active for ${addTablesRest.name}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add tables');
    } finally { setAddTablesLoading(false); }
  };

  const tableUrl = (t) => `http://localhost:5175${t.qrCodeUrl}?t=${t.id}`;

  const downloadQr = () => {
    const svg  = document.getElementById(`qr-svg-${slide}`);
    const data = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx    = canvas.getContext('2d');
    const img    = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `${selRest.slug}-${tables[slide].tableNumber}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(data)));
  };

  const copyLink = () => {
    const t = tables[slide];
    navigator.clipboard.writeText(tableUrl(t)).then(() => {
      setCopied(t.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const whatsapp = () => {
    const t = tables[slide];
    const url = encodeURIComponent(`QR link for ${t.tableNumber} at ${selRest.name}:\n${tableUrl(t)}`);
    window.open(`https://api.whatsapp.com/send?text=${url}`, '_blank');
  };

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={s.pageHead}>
        <div>
          <h2 style={s.pageTitle}>Restaurants</h2>
          <p style={s.pageSub}>Manage all onboarded restaurants and their QR codes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Plus size={16} /> Add Restaurant
        </button>
      </div>

      {/* ── Card ── */}
      <div style={s.card}>
        {loading ? (
          <div className="state-box">
            <Loader2 size={30} className="spin" style={{ color: 'var(--primary)' }} />
            <p>Loading restaurants…</p>
          </div>
        ) : error ? (
          <div className="state-box">
            <AlertCircle size={30} style={{ color: 'var(--danger)' }} />
            <p style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="state-box">
            <Store size={36} style={{ color: 'var(--text-muted)' }} />
            <h3>No restaurants yet</h3>
            <p>Click "Add Restaurant" to onboard your first restaurant.</p>
            <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={() => setAddOpen(true)}>
              <Plus size={15} /> Add Restaurant
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Restaurant', 'URL Slug', 'Owner', 'Tables', 'Status', 'Actions'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {restaurants.map(r => (
                  <tr key={r.id} style={s.tr}>
                    <td style={s.td}>
                      <div style={s.restName}>{r.name}</div>
                      {r.phone && <div style={s.restPhone}>{r.phone}</div>}
                    </td>
                    <td style={s.td}>
                      <code style={s.code}>/{r.slug}</code>
                    </td>
                    <td style={s.td}>
                      <div style={{ fontWeight: 500 }}>{r.owner?.name || '—'}</div>
                      <div style={s.restPhone}>{r.owner?.email}</div>
                    </td>
                    <td style={s.td}>
                      <span className="badge badge-primary">{r._count?.tables || 0}</span>
                    </td>
                    <td style={s.td}>
                      <span className={`badge ${r.subscriptionStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                        {r.subscriptionStatus}
                      </span>
                    </td>
                    <td style={{ ...s.td, whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => window.location.href = `/restaurants/${r.id}/qrcodes`}
                        >
                          <QrCode size={14} /> QR Codes
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setAddTablesRest(r);
                            setAddTablesCount('5');
                            setAddTablesSuccess('');
                            setAddTablesOpen(true);
                          }}
                          title="Add more tables"
                        >
                          <TableProperties size={14} /> + Tables
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => window.location.href = `/restaurants/${r.id}/menu`}
                        >
                          <ExternalLink size={14} /> Menu
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Tables Modal ── */}
      {addTablesOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAddTablesOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '380px' }}>
            <div className="modal-head">
              <div>
                <h2>Add Tables</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {addTablesRest?.name}
                </p>
              </div>
              <button className="btn-icon" onClick={() => setAddTablesOpen(false)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {addTablesSuccess ? (
                <div className="alert alert-success" style={{ marginBottom: 0 }}>
                  <CheckCircle2 size={16} />
                  {addTablesSuccess}
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-sub)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Currently <strong>{addTablesRest?._count?.tables || 0} tables</strong>.
                    How many total tables should this restaurant have?
                  </p>
                  <div style={{ display: 'flex', align: 'center', gap: '10px' }}>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      className="form-input"
                      value={addTablesCount}
                      onChange={e => setAddTablesCount(e.target.value)}
                      style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}
                      autoFocus
                    />
                    <span style={{ alignSelf: 'center', fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      tables total
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    This will replace all existing tables with the new count.
                  </p>
                </>
              )}
            </div>

            <div className="modal-foot">
              {addTablesSuccess ? (
                <button className="btn btn-primary" onClick={() => setAddTablesOpen(false)}>Done</button>
              ) : (
                <>
                  <button className="btn btn-secondary" onClick={() => setAddTablesOpen(false)}>Cancel</button>
                  <button
                    className="btn btn-primary"
                    onClick={handleAddTables}
                    disabled={addTablesLoading || !addTablesCount}
                  >
                    {addTablesLoading
                      ? <><Loader2 size={14} className="spin" /> Generating…</>
                      : <><TableProperties size={14} /> Generate Tables</>
                    }
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Restaurant Modal ── */}
      {addOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !submitting && setAddOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '680px' }}>
            <div className="modal-head">
              <h2>Add New Restaurant</h2>
              <button className="btn-icon" onClick={() => !submitting && setAddOpen(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {formError   && <div className="alert alert-error"><AlertCircle size={15}/>{formError}</div>}
                {formSuccess  && <div className="alert alert-success"><CheckCircle2 size={15}/>Restaurant created successfully!</div>}

                <div style={s.formGrid}>
                  {/* Restaurant info */}
                  <div>
                    <p style={s.sectionLabel}>Restaurant Details</p>
                    <div style={s.fieldGroup}>
                      <Field label="Restaurant Name *">
                        <input name="name" className="form-input" value={form.name} onChange={handleChange} required />
                      </Field>
                      <Field label="URL Slug *" hint="Auto-generated from name">
                        <input name="slug" className="form-input" value={form.slug} onChange={handleChange} required />
                      </Field>
                      <Field label="Phone Number">
                        <input name="phone" className="form-input" value={form.phone} onChange={handleChange} />
                      </Field>
                      <Field label="Address">
                        <textarea name="address" className="form-input" rows={2} value={form.address} onChange={handleChange} style={{ resize: 'vertical' }} />
                      </Field>
                    </div>
                  </div>

                  {/* Owner */}
                  <div>
                    <p style={s.sectionLabel}>Owner Account</p>
                    <div style={s.fieldGroup}>
                      <Field label="Owner Name">
                        <input name="ownerName" className="form-input" value={form.ownerName} onChange={handleChange} />
                      </Field>
                      <Field label="Owner Email *">
                        <input type="email" name="ownerEmail" className="form-input" value={form.ownerEmail} onChange={handleChange} required />
                      </Field>
                      <Field label="Password *">
                        <input type="password" name="ownerPassword" className="form-input" value={form.ownerPassword} onChange={handleChange} required />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><Loader2 size={14} className="spin" /> Creating…</> : 'Create Restaurant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QR Codes Modal ── */}
      {qrOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setQrOpen(false)}>
          <div className="modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-head">
              <div>
                <h2>QR Codes</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{selRest?.name}</p>
              </div>
              <button className="btn-icon" onClick={() => setQrOpen(false)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ minHeight: '380px' }}>
              {tables.length === 0 ? (
                <div className="state-box" style={{ padding: '16px' }}>
                  <QrCode size={40} style={{ color: 'var(--text-muted)' }} />
                  <h3>No tables yet</h3>
                  <p>How many tables does this restaurant have?</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                    <input
                      type="number" min="1" max="100"
                      value={tableCount}
                      onChange={e => setTableCount(e.target.value)}
                      className="form-input"
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                    <button className="btn btn-primary" onClick={generateTables} disabled={generating}>
                      {generating ? <><Loader2 size={14} className="spin" /> Generating…</> : 'Generate'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Carousel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn-icon" onClick={() => setSlide(p => Math.max(0, p-1))} disabled={slide === 0} style={{ flexShrink: 0 }}>
                      <ChevronLeft size={20} />
                    </button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      {/* QR Card */}
                      <div style={s.qrCard}>
                        <p style={s.tableNum}>{tables[slide].tableNumber}</p>
                        <QRCodeSVG
                          id={`qr-svg-${slide}`}
                          value={tableUrl(tables[slide])}
                          size={180}
                          level="H"
                          includeMargin
                        />
                        <p style={s.qrHint}>Scan to order</p>
                      </div>

                      {/* Link */}
                      <div style={{ width: '100%' }}>
                        <p style={s.linkLabel}>Table link</p>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input readOnly value={tableUrl(tables[slide])} className="form-input" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }} />
                          <button className="btn btn-secondary" style={{ padding: '8px 10px', flexShrink: 0 }} onClick={copyLink}>
                            {copied === tables[slide].id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={whatsapp}>
                          <Share2 size={14} /> WhatsApp
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadQr}>
                          <Download size={14} /> Download
                        </button>
                      </div>
                    </div>

                    <button className="btn-icon" onClick={() => setSlide(p => Math.min(tables.length-1, p+1))} disabled={slide === tables.length-1} style={{ flexShrink: 0 }}>
                      <ChevronRight size={20} />
                    </button>
                  </div>

                  {/* Counter */}
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '12px' }}>
                    {slide + 1} of {tables.length} tables
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Small helper ── */
function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-sub)' }}>
        {label} {hint && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

const s = {
  pageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' },
  pageSub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' },

  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },

  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: {
    padding: '11px 16px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    background: 'var(--bg)',
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    whiteSpace: 'nowrap',
  },
  td: { padding: '13px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  tr: { transition: 'background 0.15s' },
  restName: { fontWeight: 600, color: 'var(--text)' },
  restPhone: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1px' },
  code: { fontSize: '0.78rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' },

  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
  sectionLabel: { fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },

  qrCard: { background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' },
  tableNum: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '12px' },
  qrHint: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '10px' },
  linkLabel: { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' },
};
