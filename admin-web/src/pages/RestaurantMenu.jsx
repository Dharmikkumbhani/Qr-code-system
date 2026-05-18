import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Loader2, Plus, ArrowLeft, Trash2, Edit2, AlertCircle, Image as ImageIcon } from 'lucide-react';

const RestaurantMenu = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Category State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  
  // Menu Item State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemData, setItemData] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    isVeg: true
  });

  const fetchMenu = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/restaurants/${id}/menu`);
      setRestaurant(res.data.data.restaurant);
      setCategories(res.data.data.categories || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch menu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [id]);

  // CATEGORY HANDLERS
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName) return;
    try {
      if (editingCategory) {
        await api.put(`/restaurants/${id}/menu/${editingCategory.id}`, { name: categoryName });
      } else {
        await api.post(`/restaurants/${id}/menu`, { name: categoryName });
      }
      setShowCategoryModal(false);
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category and ALL its items?')) return;
    try {
      await api.delete(`/restaurants/${id}/menu/${categoryId}`);
      fetchMenu();
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  // ITEM HANDLERS
  const openAddItemModal = (categoryId) => {
    setActiveCategoryId(categoryId);
    setEditingItem(null);
    setItemData({ name: '', price: '', description: '', imageUrl: '', isVeg: true });
    setShowItemModal(true);
  };

  const openEditItemModal = (item, categoryId) => {
    setActiveCategoryId(categoryId);
    setEditingItem(item);
    setItemData({ 
      name: item.name, 
      price: item.price, 
      description: item.description || '', 
      imageUrl: item.imageUrl || '', 
      isVeg: item.isVeg 
    });
    setShowItemModal(true);
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/restaurants/${id}/menu/items/${editingItem.id}`, itemData);
      } else {
        await api.post(`/restaurants/${id}/menu/items`, {
          ...itemData,
          categoryId: activeCategoryId
        });
      }
      setShowItemModal(false);
      fetchMenu();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/restaurants/${id}/menu/items/${itemId}`);
      fetchMenu();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  // Helpers
  const formatPrice = (price) => {
    // Ensures nice formatting like "20" instead of "19.96" or "20.00"
    const parsed = Number(price);
    return isNaN(parsed) ? '0' : parsed.toFixed(2).replace(/\.00$/, '');
  };

  if (isLoading) {
    return (
      <div className="flex-center" style={{ height: '80vh' }}>
        <Loader2 size={40} className="spin text-primary" />
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <button className="icon-btn" onClick={() => navigate('/restaurants')}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="page-title">{restaurant?.name} - Menu</h1>
            <p className="page-subtitle">Manage categories and items</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openAddCategory}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="empty-state card mt-6">
          <AlertCircle size={48} className="text-secondary" />
          <h3>No Menu Categories</h3>
          <p>Start by adding a category like "Starters" or "Main Course".</p>
        </div>
      ) : (
        <div className="categories-list">
          {categories.map(category => (
            <div key={category.id} className="category-section">
              <div className="category-header">
                <div className="flex items-center gap-4">
                  <h2>{category.name}</h2>
                  <div className="category-actions">
                    <button className="icon-btn-small edit" onClick={() => openEditCategory(category)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn-small delete" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <button className="btn-secondary" onClick={() => openAddItemModal(category.id)}>
                  <Plus size={16} /> Add Item
                </button>
              </div>
              
              {category.menuItems?.length === 0 ? (
                <div className="empty-items">No items in this category yet.</div>
              ) : (
                <div className="items-grid">
                  {category.menuItems.map(item => (
                    <div key={item.id} className="menu-card">
                      <div className="menu-image-container">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="menu-image" />
                        ) : (
                          <div className="menu-image-placeholder">
                            <ImageIcon size={32} className="text-secondary" />
                          </div>
                        )}
                        <span className={`veg-badge ${item.isVeg ? 'veg' : 'non-veg'}`}></span>
                      </div>
                      <div className="menu-details">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="menu-name">{item.name}</h4>
                          <span className="menu-price">₹{formatPrice(item.price)}</span>
                        </div>
                        {item.description && <p className="menu-desc">{item.description}</p>}
                        
                        <div className="menu-actions">
                          <button className="icon-btn-small edit" onClick={() => openEditItemModal(item, category.id)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn-small delete" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            </div>
            <form onSubmit={handleCategorySubmit} className="modal-body p-6">
              <div className="form-group mb-6">
                <label>Category Name</label>
                <input 
                  required 
                  className="input w-full mt-1" 
                  value={categoryName} 
                  onChange={e => setCategoryName(e.target.value)} 
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" className="btn-secondary" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
            </div>
            <form onSubmit={handleItemSubmit} className="modal-body p-6">
              <div className="form-group mb-4">
                <label>Item Name *</label>
                <input 
                  required 
                  className="input w-full mt-1" 
                  value={itemData.name} 
                  onChange={e => setItemData({...itemData, name: e.target.value})} 
                />
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="form-group flex-1">
                  <label>Price (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    step="0.01"
                    className="input w-full mt-1" 
                    value={itemData.price} 
                    onChange={e => setItemData({...itemData, price: e.target.value})} 
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Type</label>
                  <select 
                    className="input w-full mt-1" 
                    value={itemData.isVeg ? 'veg' : 'nonveg'}
                    onChange={e => setItemData({...itemData, isVeg: e.target.value === 'veg'})}
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="nonveg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label>Description (Optional)</label>
                <textarea 
                  className="input w-full mt-1" 
                  rows="2"
                  value={itemData.description} 
                  onChange={e => setItemData({...itemData, description: e.target.value})} 
                ></textarea>
              </div>

              <div className="form-group mb-6">
                <label>Image URL (Optional)</label>
                <input 
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="input w-full mt-1" 
                  value={itemData.imageUrl} 
                  onChange={e => setItemData({...itemData, imageUrl: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn-secondary" onClick={() => setShowItemModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>
        {`
          .flex { display: flex; }
          .flex-1 { flex: 1; }
          .justify-between { justify-content: space-between; }
          .justify-end { justify-content: flex-end; }
          .items-start { align-items: flex-start; }
          .items-center { align-items: center; }
          .gap-4 { gap: 1rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mt-6 { margin-top: 1.5rem; }
          .w-full { width: 100%; }
          .p-6 { padding: 1.5rem; }
          
          .flex-center { display: flex; align-items: center; justify-content: center; }
          .icon-btn { background: none; border: none; color: var(--text-primary); cursor: pointer; border-radius: 50%; padding: 0.5rem; transition: background 0.2s; }
          .icon-btn:hover { background: rgba(255,255,255,0.1); }
          
          /* BUTTON FIXES */
          .btn-primary { display: flex; align-items: center; gap: 0.5rem; background: var(--primary-color) !important; color: #fff !important; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; border: none; cursor: pointer; transition: background 0.2s; }
          .btn-primary:hover:not(:disabled) { background: var(--primary-hover) !important; }
          
          .btn-secondary { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.2rem; border-radius: 6px; font-weight: 500; background: transparent !important; border: 1px solid var(--border-color); color: var(--text-primary) !important; cursor: pointer; transition: all 0.2s; }
          .btn-secondary:hover:not(:disabled) { background: rgba(255,255,255,0.05) !important; }

          .input { padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-primary); outline: none; }
          .input:focus { border-color: var(--primary-color); }
          label { font-size: 0.875rem; color: var(--text-secondary); font-weight: 500; }
          
          .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; }
          .page-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
          .page-subtitle { font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem; }

          .categories-list { margin-top: 2rem; display: flex; flex-direction: column; gap: 3rem; }
          .category-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .category-header h2 { font-size: 1.5rem; color: var(--text-primary); }
          .category-actions { display: flex; gap: 0.5rem; }
          
          .empty-items { color: var(--text-secondary); font-style: italic; }
          .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
          
          .menu-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; }
          .menu-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); }
          
          .menu-image-container { position: relative; width: 100%; height: 160px; background: rgba(0,0,0,0.2); }
          .menu-image { width: 100%; height: 100%; object-fit: cover; }
          .menu-image-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
          
          .veg-badge { position: absolute; top: 1rem; right: 1rem; width: 20px; height: 20px; background: white; border-radius: 4px; border: 2px solid; display: flex; align-items: center; justify-content: center; }
          .veg-badge::after { content: ''; width: 10px; height: 10px; border-radius: 50%; }
          .veg-badge.veg { border-color: #10b981; }
          .veg-badge.veg::after { background-color: #10b981; }
          .veg-badge.non-veg { border-color: #ef4444; }
          .veg-badge.non-veg::after { background-color: #ef4444; }

          .menu-details { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
          .menu-name { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin: 0; }
          .menu-price { font-size: 1.125rem; font-weight: 700; color: var(--primary-color); }
          .menu-desc { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.5rem; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
          
          .menu-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: auto; border-top: 1px solid var(--border-color); padding-top: 1rem; }
          .icon-btn-small { background: none; border: none; cursor: pointer; padding: 0.4rem; border-radius: 6px; transition: all 0.2s; color: var(--text-secondary); display: flex; align-items: center; justify-content: center; }
          .icon-btn-small:hover { background: rgba(255,255,255,0.05); }
          .icon-btn-small.edit:hover { color: var(--primary-color); background: rgba(59, 130, 246, 0.1); }
          .icon-btn-small.delete:hover { color: var(--danger-color); background: rgba(239, 68, 68, 0.1); }
          
          .card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; }
          .spin { animation: spin 1s linear infinite; }
          
          /* Modal Setup */
          .modal-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 1rem; }
          .modal-content { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: 12px; width: 100%; max-width: 600px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3); }
          .modal-header { padding: 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
          .modal-header h2 { font-size: 1.25rem; font-weight: 600; margin: 0; }
          .modal-body { overflow-y: auto; }
        `}
      </style>
    </div>
  );
};

export default RestaurantMenu;
