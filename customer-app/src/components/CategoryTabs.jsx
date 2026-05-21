import { useRef, useEffect } from 'react';
import './CategoryTabs.css';

// Map category names to simple emoji icons as fallback
const CATEGORY_ICONS = {
  default: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  breakfast: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round"/>
      <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round"/>
      <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round"/>
    </svg>
  ),
  'cold drink': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 2h8l-1 10H9L8 2z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 12v9a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 7h12" strokeLinecap="round"/>
    </svg>
  ),
  'hot drink': (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 3c0-1 .8-2 2-2s2 1 2 2-.8 2-2 2" strokeLinecap="round"/>
    </svg>
  ),
  lassi: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 3h14l-2 17H7L5 3z" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 8h14" strokeLinecap="round"/>
    </svg>
  ),
  snack: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" strokeLinecap="round"/>
      <path d="M8 12h8M12 8v8" strokeLinecap="round"/>
    </svg>
  ),
};

function getCategoryIcon(name = '') {
  const key = name.toLowerCase();
  for (const k of Object.keys(CATEGORY_ICONS)) {
    if (k !== 'default' && key.includes(k)) return CATEGORY_ICONS[k];
  }
  return CATEGORY_ICONS.default;
}

export default function CategoryTabs({ categories, activeId, onSelect }) {
  const tabsRef = useRef(null);

  useEffect(() => {
    if (!tabsRef.current || !activeId) return;
    const activeEl = tabsRef.current.querySelector(`[data-id="${activeId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="cat-tabs" ref={tabsRef}>
      {categories.map((cat) => {
        const isActive = activeId === cat.id;
        return (
          <button
            key={cat.id}
            data-id={cat.id}
            className={`cat-tab ${isActive ? 'cat-tab--active' : ''}`}
            onClick={() => onSelect(cat.id)}
            aria-pressed={isActive}
          >
            {/* Active indicator dot */}
            {isActive && <span className="cat-tab__dot" />}

            {/* Icon */}
            <span className="cat-tab__icon">
              {getCategoryIcon(cat.name)}
            </span>

            {/* Label */}
            <span className="cat-tab__label">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
