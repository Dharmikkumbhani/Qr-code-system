import './QuantityControl.css';

export default function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="qty-control">
      <button
        className="qty-btn qty-btn--minus"
        onClick={onDecrease}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="qty-value">{quantity}</span>
      <button
        className="qty-btn qty-btn--plus"
        onClick={onIncrease}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
