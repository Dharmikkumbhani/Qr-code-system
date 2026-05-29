import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getSessionOrders } from '../api/index';
import { initiateSocketConnection, disconnectSocket } from '../api/socket';
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

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    if (!tableId) return;
    try {
      const { data } = await getSessionOrders(tableId);
      const fetchedOrders = data.data;
      setOrders(fetchedOrders);
      return fetchedOrders;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch orders.');
      return [];
    }
  };

  useEffect(() => {
    let socket;
    const initialize = async () => {
      const fetchedOrders = await fetchOrders();
      if (fetchedOrders && fetchedOrders.length > 0) {
        const restaurantId = fetchedOrders[0].restaurantId;
        socket = initiateSocketConnection(restaurantId);
        
        socket.off('orderUpdated');
        socket.off('newOrder');

        socket.on('orderUpdated', (updatedOrder) => {
          if (updatedOrder.tableId === tableId) fetchOrders();
        });
        
        socket.on('newOrder', (newOrder) => {
          if (newOrder.tableId === tableId) fetchOrders();
        });
      }
    };

    initialize();

    return () => {
      disconnectSocket();
    };
  }, [tableId]);

  const handleOrderMore = () => {
    navigate(`/menu/${restaurantSlug}?t=${tableId}`);
  };

  const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const currentOrder = orders.find(o => o.id === orderId) || orders[0];
  const shortId = currentOrder ? currentOrder.id.slice(-8).toUpperCase() : '—';
  
  // Overall status could be the status of the current order
  const overallStatus = currentOrder ? currentOrder.status : 'PENDING';
  const cfg = STATUS_CONFIG[overallStatus] || STATUS_CONFIG.PENDING;

  // Check if any order is still processing
  const anyProcessing = orders.some(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');

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
      <p className="success-order-id">Latest Order #{shortId}</p>

      {/* Main Status Badge */}
      <div className={`status-badge ${cfg.cls}`}>
        <span className="status-badge__label">{cfg.label}</span>
        <span className="status-badge__desc">{cfg.desc}</span>
      </div>

      {error && <p className="error-msg" style={{ margin: '0 24px' }}>{error}</p>}

      {/* Order Items Summary */}
      {orders.length > 0 && (
        <div className="success-orders-container">
          
          {orders.map(o => {
            const oCfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={o.id} className="order-card">
                <div className="order-card__header">
                  <span className="order-card__title">Order #{o.id.slice(-8).toUpperCase()}</span>
                  <span className={`order-card__status ${oCfg.cls}`}>{oCfg.label}</span>
                </div>
                
                <div className="order-card__items">
                  {o.orderItems.map((item) => (
                    <div key={item.id} className="success-item">
                      <span className="success-item__name">{item.menuItem?.name}</span>
                      <span className="success-item__meta">
                        x{item.quantity} · ₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          <div className="success-total-card">
            <span>Total Payable</span>
            <span>₹{totalAmount.toFixed(0)}</span>
          </div>
        </div>
      )}

      {/* Polling indicator */}
      {anyProcessing && (
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
