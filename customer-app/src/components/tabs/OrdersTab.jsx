import React from 'react';
import './Tabs.css';

const STATUS_ICONS = {
  PENDING:   '⏳',
  ACCEPTED:  '👨‍🍳',
  COMPLETED: '✅',
  CANCELLED: '❌',
};

export default function OrdersTab({ orders = [], onGoToMenu }) {
  const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const anyProcessing = orders.some(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
  const firstOrderTime = orders.length > 0 
    ? new Date(Math.min(...orders.map(o => new Date(o.createdAt)))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  if (orders.length === 0) {
    return (
      <div className="tab-container fade-up empty-state">
        <div className="empty-icon">🍽️</div>
        <h2>No orders yet</h2>
        <p>Looks like you haven't placed any orders in this session.</p>
        <button className="btn-primary" onClick={onGoToMenu} style={{ marginTop: '20px' }}>
          Browse Menu
        </button>
      </div>
    );
  }

  // Combine all items from all orders
  const allItems = orders.flatMap(o => 
    o.orderItems.map(item => ({
      ...item,
      orderStatus: o.status
    }))
  );

  return (
    <div className="tab-container fade-up">
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 className="tab-title" style={{ margin: 0 }}>Your Bill</h2>
        {firstOrderTime && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Started at {firstOrderTime}
          </p>
        )}
      </div>

      <div className="home-card" style={{ padding: '24px 20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {allItems.map((item, idx) => (
            <div key={`${item.id}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
                  {item.menuItem?.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>x{item.quantity}</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {STATUS_ICONS[item.orderStatus] || '⏳'} {item.orderStatus}
                </span>
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                ₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(0)}
              </span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed var(--border-dark)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Total Payable</span>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>₹{totalAmount.toFixed(0)}</span>
        </div>
      </div>

      {anyProcessing && (
        <p className="success-polling" style={{ marginTop: '20px', justifyContent: 'center', fontSize: '0.9rem' }}>
          <span className="pulse-dot" /> Kitchen is preparing some items…
        </p>
      )}

      {/* padding for bottom nav */}
      <div style={{ height: '80px' }} />
    </div>
  );
}
