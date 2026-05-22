import React from 'react';
import './Tabs.css';

export default function HomeTab({ restaurant, tableId, tableNumber }) {
  const specials = [
    { name: 'Tandoori Platter', price: '₹450', desc: 'Assortment of fresh tandoori items.' },
    { name: 'Paneer Butter Masala', price: '₹280', desc: 'Rich and creamy paneer curry.' },
  ];

  const chefRecs = [
    { name: 'Special Masala Chai', price: '₹50' },
    { name: 'Garlic Naan', price: '₹60' }
  ];

  const tableLabel = tableNumber 
    ? (tableNumber.toLowerCase().includes('table') ? tableNumber : `Table ${tableNumber}`) 
    : (tableId ? `Table ${tableId.slice(-4).toUpperCase()}` : 'Welcome');

  return (
    <div className="tab-container fade-up">
      <div className="home-hero">
        <h1 className="home-title">Welcome to {restaurant?.name || 'our restaurant'}</h1>
        <p className="home-subtitle">{tableLabel}</p>
      </div>

      <div className="home-section">
        <h2 className="home-section__title">Today's Specials ✨</h2>
        <div className="home-cards">
          {specials.map((item, i) => (
            <div key={i} className="home-card">
              <div className="home-card__header">
                <h3>{item.name}</h3>
                <span>{item.price}</span>
              </div>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="home-section">
        <h2 className="home-section__title">Chef's Recommendations 👨‍🍳</h2>
        <div className="home-cards home-cards--small">
          {chefRecs.map((item, i) => (
            <div key={i} className="home-card home-card--compact">
              <h3>{item.name}</h3>
              <span>{item.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="home-info-grid">
        <div className="home-info-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M5 12.55a11 11 0 0114.08 0 M1.42 9a16 16 0 0121.16 0 M8.53 16.11a6 6 0 016.95 0 M12 20h.01" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h4>Wi-Fi</h4>
          <p>{restaurant?.name?.replace(/\s+/g, '').toLowerCase() || 'guest'}_wifi</p>
          <p className="home-info-sub">Pass: welcome123</p>
        </div>
        <div className="home-info-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h4>Hours</h4>
          <p>11:00 AM - 11:00 PM</p>
          <p className="home-info-sub">Open Today</p>
        </div>
      </div>
      
      {/* padding for bottom nav */}
      <div style={{ height: '80px' }} />
    </div>
  );
}
