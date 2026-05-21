import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Loader2, Plus, ArrowLeft, Trash2, Edit2,
  AlertCircle, X, Image as ImageIcon, ChevronDown, ChevronUp
} from 'lucide-react';

export default function RestaurantMenu() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [collapsed, setCollapsed]   = useState({});

  /* Category modal */
  const [catModal, setCatModal]     = useState(false);
  const [editCat, setEditCat]       = useState(null);
  const [catName, setCatName]       = useState('');
  const [catSaving, setCatSaving]   = useState(false);

  /* Item modal */
  const [itemModal, setItemModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [activeCatId, setActiveCatId] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemForm, setItemForm]     = useState({
    name: '', price: '', description: '', imageUrl: '', isVeg: true
  });

  /* ── Fetch ── */
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/restaurants/${id}/menu`);
      setRestaurant(res.data.data.restaurant);
      setCategories(res.data.data.categories || []);
    } catch { alert('Failed to fetch menu'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchMenu(); }, [id]);

  const toggleCollapse = (cid) => setCollapsed(p => ({ ...p, [cid]: !p[cid] }));

  /* ── Category ── */
  const openAddCat   = () => { setEditCat(null); setCatName(''); setCatModal(true); };
  const openEditCat  = (c) => { setEditCat(c); setCatName(c.name); setCatModal(true); };
  const saveCat      = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatSaving(true);
    try {
      if (editCat) await api.put(`/restaurants/${id}/menu/${editCat.id}`, { name: catName });
      else         await api.post(`/restaurants/${id}/menu`, { name: catName });
      setCatModal(false); fetchMenu();
    } catch (err) { alert(err.response?.data?.message || 'Error saving category'); }
    finally { setCatSaving(false); }
  };
  const deleteCat = async (cid) => {
    if (!window.confirm('Delete this category and ALL its items?')) return;
    try { await api.delete(`/restaurants/${id}/menu/${cid}`); fetchMenu(); }
    catch { alert('Failed to delete category'); }
  };

  /* ── Item ── */
  const openAddItem  = (cid) => { setActiveCatId(cid); setEditItem(null); setItemForm({ name:'', price:'', description:'', imageUrl:'', isVeg: true }); setItemModal(true); };
  const openEditItem = (item, cid) => {
    setActiveCatId(cid); setEditItem(item);
    setItemForm({ name: item.name, price: item.price, description: item.description||'', imageUrl: item.imageUrl||'', isVeg: item.isVeg });
    setItemModal(true);
  };
  const saveItem = async (e) => {
    e.preventDefault();
    setItemSaving(true);
    try {
      if (editItem) await api.put(`/restaurants/${id}/menu/items/${editItem.id}`, itemForm);
      else          await api.post(`/restaurants/${id}/menu/items`, { ...itemForm, categoryId: activeCatId });
      setItemModal(false); fetchMenu();
    } catch (err) { alert(err.response?.data?.message || 'Error saving item'); }
    finally { setItemSaving(false); }
  };
  const deleteItem = async (iid) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/restaurants/${id}/menu/items/${iid}`); fetchMenu(); }
    catch { alert('Failed to delete item'); }
  };

  const fmt = (p) => { const n = Number(p); return isNaN(n) ? '0' : n % 1 === 0 ? String(n) : n.toFixed(2); };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <Loader2 size={36} className="spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={s.pageHead}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn-icon" onClick={() => navigate('/restaurants')} style={{ width: '36px', height: '36px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 style={s.pageTitle}>{restaurant?.name}</h2>
            <p style={s.pageSub}>Menu Management — categories &amp; items</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAddCat}>
          <Plus size={15} /> Add Category
        </button>
      </div>

      {/* ── Content ── */}
      {categories.length === 0 ? (
        <div style={s.card}>
          <div className="state-box">
            <AlertCircle size={36} style={{ color: 'var(--text-muted)' }} />
            <h3>No categories yet</h3>
            <p>Start by adding a category like "Starters" or "Main Course".</p>
            <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={openAddCat}>
              <Plus size={15} /> Add Category
            </button>
          </div>
        </div>
      ) : (
        <div style={s.categoriesList}>
          {categories.map(cat => (
            <div key={cat.id} style={s.card}>
              {/* Category Header */}
              <div style={s.catHead}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <button
                    style={s.collapseBtn}
                    onClick={() => toggleCollapse(cat.id)}
                    title={collapsed[cat.id] ? 'Expand' : 'Collapse'}
                  >
                    {collapsed[cat.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                  <h3 style={s.catName}>{cat.name}</h3>
                  <span className="badge badge-primary" style={{ flexShrink: 0 }}>
                    {cat.menuItems?.length || 0} items
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => openAddItem(cat.id)}>
                    <Plus size={13} /> Add Item
                  </button>
                  <button className="btn-icon edit" title="Edit category" onClick={() => openEditCat(cat)}><Edit2 size={14} /></button>
                  <button className="btn-icon danger" title="Delete category" onClick={() => deleteCat(cat.id)}><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Items */}
              {!collapsed[cat.id] && (
                cat.menuItems?.length === 0 ? (
                  <div style={s.emptyItems}>
                    <p>No items yet. <button style={s.inlineBtn} onClick={() => openAddItem(cat.id)}>Add the first item →</button></p>
                  </div>
                ) : (
                  <div style={s.itemsList}>
                    {cat.menuItems.map((item, idx) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 16px',
                          borderTop: '1px solid var(--border)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Veg / Non-veg dot */}
                        <span
                          style={{
                            width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0,
                            background: item.isVeg ? 'var(--success)' : 'var(--danger)',
                            boxShadow: item.isVeg
                              ? '0 0 0 2px rgba(16,185,129,0.18)'
                              : '0 0 0 2px rgba(239,68,68,0.18)',
                          }}
                          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                        />

                        {/* Thumbnail — only if image exists */}
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: '34px', height: '34px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        )}

                        {/* Name + inline description */}
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '6px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                          {item.description && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              — {item.description}
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-sub)', flexShrink: 0, minWidth: '52px', textAlign: 'right' }}>
                          ₹{fmt(item.price)}
                        </span>

                        {/* Edit / Delete */}
                        <button className="btn-icon edit" onClick={() => openEditItem(item, cat.id)} title="Edit" style={{ flexShrink: 0 }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="btn-icon danger" onClick={() => deleteItem(item.id)} title="Delete" style={{ flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Category Modal ── */}
      {catModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setCatModal(false)}>
          <div className="modal-box" style={{ maxWidth: '400px' }}>
            <div className="modal-head">
              <h2>{editCat ? 'Edit Category' : 'Add Category'}</h2>
              <button className="btn-icon" onClick={() => setCatModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveCat}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={s.label}>Category Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Starters, Main Course…"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={catSaving}>
                  {catSaving ? <><Loader2 size={14} className="spin" /> Saving…</> : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Item Modal ── */}
      {itemModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setItemModal(false)}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div className="modal-head">
              <h2>{editItem ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button className="btn-icon" onClick={() => setItemModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={saveItem}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* Name */}
                <div style={s.fieldWrap}>
                  <label style={s.label}>Item Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Paneer Butter Masala"
                    value={itemForm.name}
                    onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                    required
                    autoFocus
                  />
                </div>

                {/* Price + Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Price (₹) *</label>
                    <input
                      type="number" min="0" step="0.01"
                      className="form-input"
                      placeholder="0.00"
                      value={itemForm.price}
                      onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Type</label>
                    <div style={s.toggleRow}>
                      <button
                        type="button"
                        style={{ ...s.toggleBtn, ...(itemForm.isVeg ? s.toggleBtnVeg : {}) }}
                        onClick={() => setItemForm(f => ({ ...f, isVeg: true }))}
                      >🟢 Veg</button>
                      <button
                        type="button"
                        style={{ ...s.toggleBtn, ...(!itemForm.isVeg ? s.toggleBtnNonVeg : {}) }}
                        onClick={() => setItemForm(f => ({ ...f, isVeg: false }))}
                      >🔴 Non-Veg</button>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={s.fieldWrap}>
                  <label style={s.label}>Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Short description…"
                    value={itemForm.description}
                    onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Image URL */}
                <div style={s.fieldWrap}>
                  <label style={s.label}>Image URL <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                    value={itemForm.imageUrl}
                    onChange={e => setItemForm(f => ({ ...f, imageUrl: e.target.value }))}
                  />
                  {itemForm.imageUrl && (
                    <img src={itemForm.imageUrl} alt="preview" style={s.imgPreview}
                      onError={e => e.target.style.display='none'} />
                  )}
                </div>
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-secondary" onClick={() => setItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={itemSaving}>
                  {itemSaving ? <><Loader2 size={14} className="spin" /> Saving…</> : (editItem ? 'Save Changes' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  pageHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' },
  pageTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' },
  pageSub: { fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' },

  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },
  categoriesList: { display: 'flex', flexDirection: 'column', gap: '12px' },

  catHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px',
    gap: '10px',
  },
  catName: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' },
  collapseBtn: {
    width: '28px', height: '28px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '6px',
    color: 'var(--text-muted)',
    flexShrink: 0,
    transition: 'var(--transition)',
  },

  emptyItems: {
    padding: '16px 20px',
    borderTop: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
  },
  inlineBtn: {
    background: 'none', border: 'none', color: 'var(--primary)',
    fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem',
  },

  itemsList: { display: 'flex', flexDirection: 'column' },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.15s',
  },
  itemImgWrap: { width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)' },
  itemImg: { width: '100%', height: '100%', objectFit: 'cover' },
  itemImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
  itemInfo: { flex: 1, minWidth: 0 },
  vegDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, display: 'inline-block' },
  itemName: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' },
  itemDesc: { fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  itemPrice: { fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', minWidth: '50px', textAlign: 'right' },

  label: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-sub)' },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: '5px' },

  toggleRow: { display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--border-dark)' },
  toggleBtn: { flex: 1, padding: '8px 4px', fontSize: '0.78rem', fontWeight: 600, background: 'var(--surface)', color: 'var(--text-muted)', cursor: 'pointer', border: 'none', transition: 'var(--transition)' },
  toggleBtnVeg:    { background: 'var(--success-light)', color: 'var(--success)' },
  toggleBtnNonVeg: { background: 'var(--danger-light)',  color: 'var(--danger)'  },

  imgPreview: { marginTop: '8px', width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' },
};
