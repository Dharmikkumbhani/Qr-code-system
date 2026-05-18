import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { sendOtp, verifyOtp, placeOrder } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LoadingSpinner from './LoadingSpinner';
import './CheckoutModal.css';

export default function CheckoutModal({ isOpen, onClose, restaurantId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('tableId');

  const { setAuth } = useAuth();
  const { items, total, clearCart } = useCart();

  const [step, setStep] = useState(1); // 1 = details, 2 = OTP
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [countdown]);

  // Focus first OTP box when entering step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!/^\d{10}$/.test(phone)) return setError('Enter a valid 10-digit mobile number.');

    setLoading(true);
    try {
      await sendOtp(phone);
      setStep(2);
      setCountdown(30);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      await sendOtp(phone);
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const updated = [...otp];
    updated[idx] = val;
    setOtp(updated);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const updated = pasted.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(updated);
    const nextEmpty = updated.findIndex((d) => d === '');
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    setTimeout(() => otpRefs.current[focusIdx]?.focus(), 0);
  };

  const handleVerifyAndOrder = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < 6) return setError('Enter the complete 6-digit OTP.');
    setError('');
    setLoading(true);

    try {
      // 1. Verify OTP → get token
      const { data: authRes } = await verifyOtp(phone, otpStr, name.trim());
      const { customer, token } = authRes.data;
      setAuth({ customer, token });

      // 2. Place order using the fresh token (store it first so interceptor picks it up)
      localStorage.setItem('customer_token', token);

      const orderPayload = {
        restaurantId,
        tableId,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          quantity: i.quantity,
          unitPrice: i.price,
          specialInstructions: i.specialInstructions || '',
        })),
      };

      const { data: orderRes } = await placeOrder(orderPayload);
      clearCart();
      navigate(`/order/${orderRes.data.id}?restaurantSlug=${searchParams.get('restaurantSlug')}&tableId=${tableId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        {/* Handle */}
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {step === 1 ? 'Almost there! 🛎️' : 'Verify OTP'}
            </h2>
            <p className="modal-subtitle">
              {step === 1
                ? 'Just your name and number to place the order'
                : `Sent to +91 ${phone.slice(0, 5)}XXXXX`}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Order Summary Strip */}
        <div className="modal-summary">
          <span className="modal-summary__items">{items.length} item{items.length !== 1 ? 's' : ''}</span>
          <span className="modal-summary__sep">·</span>
          <span className="modal-summary__total">Total ₹{total.toFixed(0)}</span>
        </div>

        {error && <p className="error-msg" style={{ margin: '0 20px' }}>{error}</p>}

        {/* Step 1 — Details */}
        {step === 1 && (
          <form className="modal-form" onSubmit={handleSendOtp}>
            <div className="modal-field">
              <label className="modal-label">Your Name</label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Ravi Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Mobile Number</label>
              <div className="phone-wrap">
                <span className="phone-prefix">+91</span>
                <input
                  className="input phone-input"
                  type="tel"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : 'Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2 — OTP */}
        {step === 2 && (
          <form className="modal-form" onSubmit={handleVerifyAndOrder}>
            <div className="otp-boxes" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpRefs.current[idx] = el)}
                  className="otp-box"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  aria-label={`OTP digit ${idx + 1}`}
                />
              ))}
            </div>

            <div className="otp-resend">
              {countdown > 0 ? (
                <span className="otp-timer">Resend in {countdown}s</span>
              ) : (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleResend}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? <LoadingSpinner /> : 'Verify & Place Order'}
            </button>

            <button type="button" className="modal-back" onClick={() => { setStep(1); setError(''); }}>
              ← Change number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
