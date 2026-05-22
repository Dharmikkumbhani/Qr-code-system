import { useCart } from '../context/CartContext';
import './CartBar.css';

export default function CartBar({ onPlaceOrder, loading }) {
  const { itemCount, total } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="cart-bar">
      <div className="cart-bar__inner">
        <div className="cart-bar__info">
          <span className="cart-bar__count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
          <span className="cart-bar__sep">·</span>
          <span className="cart-bar__total">₹{total.toFixed(0)}</span>
        </div>
        <button className="cart-bar__btn" onClick={onPlaceOrder} disabled={loading}>
          {loading ? 'Placing...' : 'Place Order'}
          {!loading && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }}>
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
