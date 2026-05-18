import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, AlertCircle, QrCode } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      setError(result.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="login-wrapper">
      {/* Left Side: Form */}
      <div className="login-form-container">
        <div className="login-card">
          <div className="login-header">
            <div className="brand">
              <QrCode size={32} color="var(--primary-color)" />
              <h2 className="brand-text">PetPooja-QR</h2>
            </div>
            <h1 className="title">Welcome Back</h1>
            <p className="subtitle">Sign in to manage your restaurant operations</p>
          </div>

          {error && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="email">Email address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  id="email"
                  type="text"
                  placeholder="admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`submit-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right Side: Visual (Hidden on mobile) */}
      <div className="login-visual-container">
        <div className="visual-content">
          <h1>Manage Your Orders Seamlessly</h1>
          <p>Scan, Order, and Serve faster than ever before. Join the next generation of restaurant management.</p>
        </div>
      </div>

      {/* Internal CSS for Login Page Specifics */}
      <style>
        {`
          .login-wrapper {
            display: flex;
            min-height: 100vh;
            width: 100vw;
            background-color: var(--bg-color);
          }

          /* Mobile-first: Full width form, centered */
          .login-form-container {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .login-visual-container {
            display: none; /* Hidden on mobile */
          }

          /* Desktop Override */
          @media (min-width: 1024px) {
            .login-wrapper {
              flex-direction: row;
            }
            .login-form-container {
              flex: 0 0 50%;
              /* Push form to left side */
              justify-content: flex-start;
              padding-left: 10%;
            }
            .login-visual-container {
              flex: 0 0 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, var(--bg-color) 0%, var(--surface-color) 100%);
              border-left: 1px solid var(--border-color);
              position: relative;
              overflow: hidden;
            }
            
            /* Add some decorative abstract shapes to the right side */
            .login-visual-container::before {
              content: '';
              position: absolute;
              top: -10%;
              right: -10%;
              width: 500px;
              height: 500px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
            }
          }

          .login-card {
            width: 100%;
            max-width: 420px;
          }

          .login-header {
            margin-bottom: 2rem;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 2rem;
          }

          .brand-text {
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.5px;
          }

          .title {
            font-size: 2rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
            letter-spacing: -0.5px;
          }

          .subtitle {
            font-size: 1rem;
            color: var(--text-secondary);
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
          }

          .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
          }

          .input-icon {
            position: absolute;
            left: 1rem;
            color: var(--text-secondary);
            width: 20px;
            height: 20px;
            pointer-events: none;
          }

          .input-field {
            width: 100%;
            padding: 0.875rem 1rem 0.875rem 3rem;
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.2s ease;
            outline: none;
          }

          .input-field:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
          }

          .submit-button {
            width: 100%;
            padding: 0.875rem;
            background-color: var(--primary-color);
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.5rem;
            transition: background-color 0.2s ease, transform 0.1s ease;
            margin-top: 2rem;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
          }

          .submit-button:hover:not(:disabled) {
            background-color: var(--primary-hover);
          }

          .submit-button:active:not(:disabled) {
            transform: scale(0.98);
          }

          .submit-button.loading {
            opacity: 0.8;
            cursor: not-allowed;
          }

          .error-box {
            background-color: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.2);
            border-radius: 8px;
            padding: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--danger-color);
            font-size: 0.875rem;
            margin-bottom: 1.5rem;
          }

          .spinner {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .visual-content {
            max-width: 400px;
            padding: 2rem;
            z-index: 10;
          }

          .visual-content h1 {
            font-size: 2.5rem;
            line-height: 1.2;
            margin-bottom: 1rem;
            color: var(--text-primary);
          }

          .visual-content p {
            font-size: 1.125rem;
            color: var(--text-secondary);
            line-height: 1.6;
          }
        `}
      </style>
    </div>
  );
};

export default Login;
