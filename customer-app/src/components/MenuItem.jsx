import { useCart } from '../context/CartContext';
import QuantityControl from './QuantityControl';
import './MenuItem.css';

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
      {/* Left: item info */}
      <div className="menu-item__info">

        <h3 className="menu-item__name">{item.name}</h3>

        {item.description && (
          <p className="menu-item__desc">{item.description}</p>
        )}

        <span className="menu-item__price">₹ {parseFloat(item.price).toFixed(2)}</span>
      </div>

      {/* Right: optional image + Add / Qty control */}
      <div className="menu-item__right">
        {/* Item image if available */}
        {item.imageUrl && (
          <div className="menu-item__img-wrap">
            <img
              className="menu-item__img"
              src={item.imageUrl}
              alt={item.name}
              loading="lazy"
            />
          </div>
        )}

        {qty === 0 ? (
          <button
            className="menu-item__add-btn"
            onClick={handleAdd}
            id={`add-${item.id}`}
          >
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
  );
}
