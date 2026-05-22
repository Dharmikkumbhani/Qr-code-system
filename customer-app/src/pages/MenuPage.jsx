import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getPublicMenu, getSessionOrders, placeOrder } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import MenuItem from '../components/MenuItem';
import CategoryTabs from '../components/CategoryTabs';
import CartBar from '../components/CartBar';
import CheckoutModal from '../components/CheckoutModal';
import LoadingSpinner from '../components/LoadingSpinner';
import HomeTab from '../components/tabs/HomeTab';
import OrdersTab from '../components/tabs/OrdersTab';
import CheckoutTab from '../components/tabs/CheckoutTab';
import './MenuPage.css';

export default function MenuPage() {
  const { slug: restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('t') || searchParams.get('tableId');

  const { customer, token, logout } = useAuth();
  const { items, clearCart } = useCart();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [restaurant, setRestaurant] = useState(null);
  const [tableNumber, setTableNumber] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home'); // default to 'home'
  
  const [orders, setOrders] = useState([]);
  const pollRef = useRef(null);

  const sectionRefs = useRef({});
  const scrollingRef = useRef(false);

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Fetch session orders globally so tabs open instantly
  const fetchOrders = useCallback(async () => {
    if (!tableId) return;
    try {
      const { data } = await getSessionOrders(tableId);
      setOrders(data.data);
    } catch (err) {
      // suppress 401 or network errors gracefully in background
    }
  }, [tableId]);

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchOrders]);

  useEffect(() => {
    if (!restaurantSlug) {
      setError('Invalid QR code — restaurant not found.');
      setLoading(false);
      return;
    }

    getPublicMenu(restaurantSlug, tableId)
      .then(({ data }) => {
        setRestaurant(data.data.restaurant);
        if (data.data.tableNumber) {
          setTableNumber(data.data.tableNumber);
        }
        const cats = data.data.categories.filter((c) => c.menuItems.length > 0);
        setCategories(cats);
        if (cats.length > 0) setActiveCategory(cats[0].id);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load menu. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [restaurantSlug]);

  // Scroll to category section
  const handleCategorySelect = (id) => {
    setActiveCategory(id);
    scrollingRef.current = true;
    const el = sectionRefs.current[id];
    if (el) {
      const headerOffset = 150;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { scrollingRef.current = false; }, 700);
    }
  };

  // Update active tab on scroll
  const handleScroll = useCallback(() => {
    if (scrollingRef.current) return;
    const headerOffset = 160;
    for (let i = categories.length - 1; i >= 0; i--) {
      const el = sectionRefs.current[categories[i].id];
      if (el && el.getBoundingClientRect().top <= headerOffset) {
        setActiveCategory(categories[i].id);
        break;
      }
    }
  }, [categories]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handlePlaceOrderClick = async () => {
    if (customer && token) {
      setIsPlacingOrder(true);
      try {
        const orderPayload = {
          restaurantId: restaurant?.id,
          tableId,
          items: items.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            unitPrice: i.price,
            specialInstructions: i.specialInstructions || '',
          })),
        };
        await placeOrder(orderPayload);
        clearCart();
        fetchOrders();
        setActiveTab('orders');
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          setIsModalOpen(true);
        } else {
          alert(err.response?.data?.message || 'Failed to place order. Please try again.');
        }
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  // Filter items by search query
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      menuItems: cat.menuItems.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.menuItems.length > 0);

  const tableLabel = tableNumber 
    ? `T${tableNumber.replace(/table\s*/i, '').trim()}` 
    : (tableId ? `T${tableId.slice(-4).toUpperCase()}` : 'T—');

  if (loading) return <LoadingSpinner fullscreen />;

  if (error) {
    return (
      <div className="menu-error">
        <div className="menu-error__icon">😕</div>
        <h2>Oops!</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="menu-page">

      {/* ── Sticky Header ─────────────────────────────── */}
      <header className="menu-header">

        {/* Top bar: brand + table chip + group order */}
        <div className="menu-header__top">
          <div className="menu-header__brand">
            {restaurant?.logoUrl ? (
              <img className="menu-header__logo" src={restaurant.logoUrl} alt={restaurant.name} />
            ) : (
              <div className="menu-header__logo-placeholder">
                {restaurant?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="menu-header__name">{restaurant?.name}</h1>
              {restaurant?.address && (
                <p className="menu-header__address">{restaurant.address}</p>
              )}
            </div>
          </div>

          <div className="menu-header__actions">
            <span className="menu-header__table">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 3h18v4H3zM3 10h18M5 10v11M19 10v11" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {tableLabel}
            </span>
            <button className="menu-header__group-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Group Order
            </button>
          </div>
        </div>

        {/* Search bar & Categories (only visible in Menu tab) */}
        {activeTab === 'menu' && (
          <>
            <div className="menu-search-wrap">
              <svg className="menu-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                className="menu-search"
                type="search"
                placeholder="Search item"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="menu-search-input"
              />
            </div>
            <CategoryTabs
              categories={categories}
              activeId={activeCategory}
              onSelect={handleCategorySelect}
            />
          </>
        )}
      </header>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="menu-main">
        {activeTab === 'home' && (
          <HomeTab restaurant={restaurant} tableId={tableId} tableNumber={tableNumber} />
        )}
        
        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders}
            onGoToMenu={() => setActiveTab('menu')} 
          />
        )}
        
        {activeTab === 'paybill' && (
          <CheckoutTab tableId={tableId} orders={orders} restaurant={restaurant} />
        )}

        {activeTab === 'menu' && (
          <>
            {filteredCategories.length === 0 ? (
              <div className="menu-empty">
                <p>No items found{searchQuery ? ` for "${searchQuery}"` : '.'}</p>
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <section
                  key={cat.id}
                  ref={(el) => (sectionRefs.current[cat.id] = el)}
                  className="menu-section"
                >
                  <div className="menu-section__header">
                    <h2 className="menu-section__title">
                      {cat.name}
                      <span className="menu-section__count">&nbsp;({cat.menuItems.length})</span>
                    </h2>
                    <svg className="menu-section__chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  <div className="menu-section__list">
                    {cat.menuItems.map((item) => (
                      <MenuItem key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))
            )}
            {/* Bottom spacing for CartBar + BottomNav */}
            <div style={{ height: '140px' }} />
          </>
        )}
      </main>

      {/* ── Cart Bar ───────────────────────────────────── */}
      {activeTab === 'menu' && (
        <CartBar onPlaceOrder={handlePlaceOrderClick} loading={isPlacingOrder} />
      )}

      {/* ── Checkout Modal ─────────────────────────────── */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => setActiveTab('orders')}
        restaurantId={restaurant?.id}
        restaurantSlug={restaurantSlug}
      />

      {/* ── Bottom Navigation ──────────────────────────── */}
      <nav className="bottom-nav">
        <button
          className={`bottom-nav__item ${activeTab === 'home' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setActiveTab('home')}
          id="nav-home"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Home</span>
        </button>

        <button
          className={`bottom-nav__item ${activeTab === 'menu' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setActiveTab('menu')}
          id="nav-menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="3" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="3" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="14" y="14" width="7" height="7" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Menu</span>
        </button>

        <button
          className={`bottom-nav__item ${activeTab === 'orders' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setActiveTab('orders')}
          id="nav-orders"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Orders</span>
        </button>

        <button
          className={`bottom-nav__item ${activeTab === 'paybill' ? 'bottom-nav__item--active' : ''}`}
          onClick={() => setActiveTab('paybill')}
          id="nav-paybill"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 10h20" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Request Bill</span>
        </button>
      </nav>
    </div>
  );
}
