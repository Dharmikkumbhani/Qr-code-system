import { useCart } from '../context/CartContext';
import QuantityControl from './QuantityControl';
import './MenuItem.css';

// Generate a gradient placeholder color from item name
function placeholderGradient(name = '') {
  const colors = [
    ['#FF6B35', '#FF8C42'],
    ['#7B2FBE', '#9D4EDD'],
    ['#0077B6', '#00B4D8'],
    ['#2D6A4F', '#52B788'],
    ['#D62828', '#F77F00'],
    ['#3A0CA3', '#7209B7'],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}

export default function MenuItem({ item }) {
  const { items, addItem, updateQty } = useCart();
  const cartItem = items.find((i) => i.menuItemId === item.id);
  const qty = cartItem?.quantity || 0;

  const handleAdd = () => {
    addItem({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      isVeg: item.isVeg,
    });
  };

  return (
    <div className="menu-item">
      {/* Image */}
      <div className="menu-item__img-wrap">
        {item.imageUrl ? (
          <img
            className="menu-item__img"
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
          />
        ) : (
          <div
            className="menu-item__img-placeholder"
            style={{ background: placeholderGradient(item.name) }}
          >
            <span>{item.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="menu-item__info">
        <div className="menu-item__top">
          <span
            className="menu-item__dot"
            style={{ background: item.isVeg ? 'var(--veg)' : 'var(--nonveg)' }}
            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
          />
          <h3 className="menu-item__name">{item.name}</h3>
        </div>

        {item.description && (
          <p className="menu-item__desc">{item.description}</p>
        )}

        <div className="menu-item__footer">
          <span className="menu-item__price">₹{parseFloat(item.price).toFixed(0)}</span>

          {qty === 0 ? (
            <button className="menu-item__add-btn" onClick={handleAdd}>
              + Add
            </button>
          ) : (
            <QuantityControl
              quantity={qty}
              onDecrease={() => updateQty(item.id, qty - 1)}
              onIncrease={() => updateQty(item.id, qty + 1)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
