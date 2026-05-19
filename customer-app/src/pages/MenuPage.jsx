import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getPublicMenu } from '../api/index';
import MenuItem from '../components/MenuItem';
import CategoryTabs from '../components/CategoryTabs';
import CartBar from '../components/CartBar';
import CheckoutModal from '../components/CheckoutModal';
import LoadingSpinner from '../components/LoadingSpinner';
import './MenuPage.css';

export default function MenuPage() {
  const { slug: restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('t') || searchParams.get('tableId');

  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sectionRefs = useRef({});
  const scrollingRef = useRef(false); // prevents tab highlight fighting scroll

  useEffect(() => {
    if (!restaurantSlug) {
      setError('Invalid QR code — restaurant not found.');
      setLoading(false);
      return;
    }

    getPublicMenu(restaurantSlug)
      .then(({ data }) => {
        setRestaurant(data.data.restaurant);
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
      const headerOffset = 120; // sticky header + tabs height
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => { scrollingRef.current = false; }, 700);
    }
  };

  // Update active tab on scroll
  const handleScroll = useCallback(() => {
    if (scrollingRef.current) return;
    const headerOffset = 140;
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

  // Short table label — last 4 chars of UUID
  const tableLabel = tableId ? `Table #${tableId.slice(-4).toUpperCase()}` : 'Your Table';

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
      {/* Sticky Header */}
      <header className="menu-header">
        <div className="menu-header__inner">
          <div>
            <h1 className="menu-header__name">{restaurant?.name}</h1>
            {restaurant?.address && (
              <p className="menu-header__address">{restaurant.address}</p>
            )}
          </div>
          <span className="menu-header__table">{tableLabel}</span>
        </div>

        {/* Category Tabs */}
        <CategoryTabs
          categories={categories}
          activeId={activeCategory}
          onSelect={handleCategorySelect}
        />
      </header>

      {/* Menu Sections */}
      <main className="menu-main">
        {categories.length === 0 ? (
          <div className="menu-empty">
            <p>No menu items available right now.</p>
          </div>
        ) : (
          categories.map((cat) => (
            <section
              key={cat.id}
              ref={(el) => (sectionRefs.current[cat.id] = el)}
              className="menu-section"
            >
              <h2 className="menu-section__title">{cat.name}</h2>
              <div className="menu-section__list">
                {cat.menuItems.map((item) => (
                  <MenuItem key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}

        {/* Bottom padding so CartBar doesn't overlap last item */}
        <div style={{ height: '100px' }} />
      </main>

      {/* Fixed Cart Bar */}
      <CartBar onPlaceOrder={() => setIsModalOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantId={restaurant?.id}
        restaurantSlug={restaurantSlug}
      />
    </div>
  );
}
