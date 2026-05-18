import { useRef, useEffect } from 'react';
import './CategoryTabs.css';

export default function CategoryTabs({ categories, activeId, onSelect }) {
  const tabsRef = useRef(null);

  // Scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current || !activeId) return;
    const activeEl = tabsRef.current.querySelector(`[data-id="${activeId}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="cat-tabs" ref={tabsRef}>
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-id={cat.id}
          className={`cat-tab ${activeId === cat.id ? 'cat-tab--active' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
