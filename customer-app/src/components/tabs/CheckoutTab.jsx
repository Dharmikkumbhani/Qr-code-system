import React, { useState } from 'react';
import { requestBill } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import './Tabs.css';

export default function CheckoutTab({ tableId, orders = [], restaurant }) {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(() => {
    return sessionStorage.getItem(`billRequested_${tableId}`) === 'true';
  });
  const [error, setError] = useState('');

  const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);
  const isCheckedOut = orders.length > 0 && orders.every(o => o.paymentStatus === 'PAID');

  const handleRequestBill = async () => {
    if (!tableId || totalAmount === 0) return;
    setLoading(true);
    setError('');
    try {
      await requestBill(tableId);
      setRequested(true);
      sessionStorage.setItem(`billRequested_${tableId}`, 'true');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not request bill. Please call a waiter.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `Bill from ${restaurant?.name || 'Restaurant'}\nTable: ${orders[0]?.table?.tableNumber || ''}\nTotal: ₹${totalAmount.toFixed(0)}\nThank you for dining with us!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTakeScreenshot = () => {
    alert("Please use your phone's screenshot shortcut (usually Power + Volume Down) to save this bill.");
  };

  const handleEndSession = () => {
    sessionStorage.removeItem(`billRequested_${tableId}`);
    logout();
    window.location.reload();
  };

  if (orders.length === 0 && !error) {
    return (
      <div className="tab-container fade-up empty-state">
        <div className="empty-icon">🧾</div>
        <h2>No bill available</h2>
        <p>You haven't ordered anything yet.</p>
      </div>
    );
  }

  // --- DIGITAL BILL UI ---
  if (isCheckedOut) {
    const firstOrderTime = new Date(Math.min(...orders.map(o => new Date(o.createdAt)))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const lastOrderTime = new Date(Math.max(...orders.map(o => new Date(o.createdAt)))).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Using last order as proxy for checkout time if needed, or just "Now"
    const checkoutTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const allItems = orders.flatMap(o => o.orderItems);
    
    // Group identical items
    const groupedItems = allItems.reduce((acc, item) => {
      const existing = acc.find(i => i.menuItem?.name === item.menuItem?.name);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, []);

    return (
      <div className="tab-container fade-up" style={{ alignItems: 'center' }}>
        <h2 className="tab-title" style={{ textAlign: 'center', marginBottom: '20px' }}>Your Digital Bill</h2>
        
        {/* Receipt Paper UI */}
        <div style={{ 
          background: '#fff', 
          color: '#333', 
          width: '100%', 
          maxWidth: '380px', 
          padding: '24px 20px', 
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          borderTop: '8px solid var(--accent)',
          fontFamily: 'monospace',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', textTransform: 'uppercase' }}>{restaurant?.name || 'Restaurant'}</h3>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>Table: {orders[0]?.table?.tableNumber || tableId.slice(-4)}</p>
            <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>Started: {firstOrderTime} | Paid: {checkoutTime}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {groupedItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ flex: 1 }}>{item.quantity}x {item.menuItem?.name}</span>
                <span style={{ fontWeight: 600 }}>₹{(parseFloat(item.unitPrice) * item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px dashed #ccc', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>TOTAL PAID</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>₹{totalAmount.toFixed(0)}</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.85rem', color: '#666' }}>
            <p>Thank you for visiting!</p>
            <p>Please come again.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '380px', marginTop: '24px' }}>
          <button 
            className="btn-primary" 
            onClick={handleShareWhatsApp}
            style={{ background: '#25D366', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Share on WhatsApp
          </button>
          
          <button 
            type="button" 
            className="btn-ghost" 
            onClick={handleTakeScreenshot}
            style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}
          >
            📸 Take a Screenshot
          </button>

          <button 
            type="button" 
            className="btn-ghost" 
            onClick={handleEndSession}
            style={{ padding: '14px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Close Session
          </button>
        </div>

        <div style={{ height: '80px' }} />
      </div>
    );
  }

  // --- REQUEST BILL UI (NOT PAID YET) ---
  return (
    <div className="tab-container fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="empty-icon" style={{ marginTop: '20px' }}>🧾</div>
      <h2 className="tab-title" style={{ textAlign: 'center', marginBottom: '10px' }}>Ready to Leave?</h2>
      
      {error && <p className="error-msg">{error}</p>}

      {!requested ? (
        <div style={{ textAlign: 'center', maxWidth: '380px', width: '100%' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '0.95rem' }}>
            Your total for this session is <strong>₹{totalAmount.toFixed(0)}</strong>. 
            Tap the button below and a waiter will bring your bill to the table.
          </p>

          <button 
            className="btn-primary" 
            onClick={handleRequestBill} 
            disabled={loading || totalAmount === 0}
            style={{ padding: '16px', fontSize: '1.1rem' }}
          >
            {loading ? 'Sending request...' : 'Request Bill at Table'}
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', maxWidth: '380px', width: '100%', padding: '20px', background: 'var(--card-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--accent)' }}>
          <h3 style={{ color: 'var(--accent)', marginBottom: '10px' }}>Request Sent! ✨</h3>
          <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            We've notified the staff. A waiter will be right with you to collect your cash or card payment. Thank you for dining with us!
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '12px' }}>
            (Once the restaurant processes your payment, your digital receipt will appear here.)
          </p>
        </div>
      )}

      <div style={{ height: '80px' }} />
    </div>
  );
}
