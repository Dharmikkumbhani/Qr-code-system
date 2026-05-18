import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../api/index';
import './OrderSuccess.css';

const STATUS_CONFIG = {
  PENDING:   { label: '⏳ Pending',         cls: 'status--pending',   desc: 'We received your order!' },
  ACCEPTED:  { label: '👨‍🍳 Being Prepared',  cls: 'status--accepted',  desc: 'Kitchen is working on it.' },
  COMPLETED: { label: '✅ Ready to Serve!',  cls: 'status--completed', desc: 'Your food is on the way!' },
  CANCELLED: { label: '❌ Cancelled',        cls: 'status--cancelled', desc: 'Please contact staff.' },
};

export default function OrderSuccess() {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const restaurantSlug = searchParams.get('restaurantSlug');
  const tableId = searchParams.get('tableId');

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('PENDING');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const fetchOrder = async () => {
    try {
      const { data } = await getOrder(orderId);
      const o = data.data;
      setOrder(o);
      setStatus(o.status);
      // Stop polling once completed or cancelled
      if (o.status === 'COMPLETED' || o.status === 'CANCELLED') {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch order status.');
      clearInterval(pollRef.current);
    }
  };

  useEffect(() => {
    fetchOrder();
    pollRef.current = setInterval(fetchOrder, 10000);
    return () => clearInterval(pollRef.current);
  }, [orderId]);

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const shortId = orderId ? orderId.slice(-8).toUpperCase() : '—';

  const handleOrderMore = () => {
    navigate(`/menu?restaurantSlug=${restaurantSlug}&tableId=${tableId}`);
  };

  return (
    <div className="success-page fade-up">
      {/* Animated Check */}
      <div className="success-circle">
        <svg className="success-check" viewBox="0 0 52 52" fill="none">
          <circle className="success-check__circle" cx="26" cy="26" r="24" />
          <path className="success-check__tick" d="M14 27l8 8 16-16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="success-title">Order Placed!</h1>
      <p className="success-order-id">Order #{shortId}</p>

      {/* Status Badge */}
      <div className={`status-badge ${cfg.cls}`}>
        <span className="status-badge__label">{cfg.label}</span>
        <span className="status-badge__desc">{cfg.desc}</span>
      </div>

      {error && <p className="error-msg" style={{ margin: '0 24px' }}>{error}</p>}

      {/* Order Items Summary */}
      {order?.orderItems && (
        <div className="success-items">
          <h3 className="success-items__title">Your Order</h3>
          {order.orderItems.map((item) => (
            <div key={item.id} className="success-item">
              <span className="success-item__name">{item.menuItem?.name}</span>
              <span className="success-item__meta">
                x{item.quantity} · ₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(0)}
              </span>
            </div>
          ))}
          <div className="success-total">
            <span>Total</span>
            <span>₹{parseFloat(order.totalAmount).toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Polling indicator */}
      {status !== 'COMPLETED' && status !== 'CANCELLED' && (
        <p className="success-polling">
          <span className="pulse-dot" /> Checking status automatically…
        </p>
      )}

      {/* CTA */}
      <div className="success-actions">
        <button className="btn-primary" onClick={handleOrderMore}>
          Order More Items
        </button>
      </div>
    </div>
  );
}
