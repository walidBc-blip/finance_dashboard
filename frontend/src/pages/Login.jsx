// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirm_password: '',
    age: '',
    annual_income: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate('/dashboard');
        }
      } else {
        if (formData.password !== formData.confirm_password) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }

        const userData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirm_password,
          age: parseInt(formData.age),
          annual_income: parseFloat(formData.annual_income)
        };

        const success = await register(userData);
        if (success) {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      name: '',
      confirm_password: '',
      age: '',
      annual_income: ''
    });
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const success = await login('john@example.com', 'demo123');
      if (success) {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Demo login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e40af 25%, #059669 50%, #0891b2 75%, #7c3aed 100%)'
  };

  const blobStyle1 = {
    position: 'absolute',
    width: '384px',
    height: '384px',
    borderRadius: '50%',
    opacity: '0.2',
    top: '20%',
    left: '20%',
    background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
    filter: 'blur(60px)',
    animation: 'pulse 4s ease-in-out infinite'
  };

  const blobStyle2 = {
    position: 'absolute',
    width: '320px',
    height: '320px',
    borderRadius: '50%',
    opacity: '0.25',
    top: '30%',
    right: '15%',
    background: 'radial-gradient(circle, #10b981 0%, transparent 70%)',
    filter: 'blur(50px)',
    animation: 'pulse 4s ease-in-out infinite',
    animationDelay: '2s'
  };

  const blobStyle3 = {
    position: 'absolute',
    width: '288px',
    height: '288px',
    borderRadius: '50%',
    opacity: '0.2',
    bottom: '20%',
    left: '30%',
    background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
    filter: 'blur(45px)',
    animation: 'pulse 4s ease-in-out infinite',
    animationDelay: '4s'
  };

  const floatingEmojiStyle = {
    position: 'absolute',
    color: 'rgba(255, 255, 255, 0.1)',
    pointerEvents: 'none',
    userSelect: 'none',
    animation: 'bounce 6s ease-in-out infinite'
  };

  const mainContainerStyle = {
    width: '100%',
    maxWidth: '512px',
    position: 'relative',
    zIndex: 10
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '48px'
  };

  const logoStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '96px',
    height: '96px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    borderRadius: '50%',
    marginBottom: '32px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'pulse 3s ease-in-out infinite'
  };

  const titleStyle = {
    fontSize: '4rem',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '24px',
    letterSpacing: '-0.025em'
  };

  const subtitleStyle = {
    color: '#d1d5db',
    fontSize: '1.25rem',
    fontWeight: '300',
    lineHeight: '1.75'
  };

  const cardStyle = {
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    padding: '40px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)'
  };

  const tabSwitcherStyle = {
    display: 'flex',
    borderRadius: '16px',
    padding: '8px',
    marginBottom: '40px',
    background: 'rgba(255, 255, 255, 0.1)'
  };

  const tabButtonStyle = {
    flex: 1,
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    border: 'none',
    cursor: 'pointer'
  };

  const activeTabStyle = {
    ...tabButtonStyle,
    background: 'white',
    color: '#1f2937',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
    transform: 'scale(1.05)'
  };

  const inactiveTabStyle = {
    ...tabButtonStyle,
    color: '#d1d5db',
    background: 'transparent'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#e5e7eb',
    marginBottom: '12px'
  };

  const inputStyle = {
    width: '100%',
    padding: '20px',
    borderRadius: '12px',
    fontSize: '1.125rem',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    outline: 'none',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  };

  const passwordContainerStyle = {
    position: 'relative'
  };

  const passwordToggleStyle = {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '1.25rem',
    cursor: 'pointer',
    transition: 'color 0.3s ease'
  };

  const submitButtonStyle = {
    width: '100%',
    padding: '20px 24px',
    borderRadius: '12px',
    fontWeight: 'bold',
    color: 'white',
    fontSize: '1.25rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.3)',
    transform: 'scale(1)',
    outline: 'none'
  };

  const demoButtonStyle = {
    width: '100%',
    padding: '16px 24px',
    borderRadius: '12px',
    fontWeight: '600',
    color: 'white',
    fontSize: '1.125rem',
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  };

  const dividerStyle = {
    margin: '32px 0 24px',
    position: 'relative'
  };

  const dividerLineStyle = {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '2px',
    background: 'rgba(255, 255, 255, 0.2)'
  };

  const dividerTextStyle = {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    fontSize: '1rem',
    padding: '8px 24px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#d1d5db',
    fontWeight: '500',
    borderRadius: '20px',
    margin: '0 auto',
    width: 'fit-content'
  };

  const toggleStyle = {
    marginTop: '40px',
    textAlign: 'center'
  };

  const toggleTextStyle = {
    color: '#d1d5db',
    fontSize: '1.125rem'
  };

  const toggleButtonStyle = {
    marginLeft: '12px',
    color: '#60a5fa',
    fontWeight: '600',
    textDecoration: 'underline',
    textDecorationThickness: '2px',
    textUnderlineOffset: '4px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.3s ease'
  };

  const demoCardStyle = {
    marginTop: '32px',
    padding: '24px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const demoHeaderStyle = {
    fontSize: '1rem',
    color: '#d1d5db',
    fontWeight: '600',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const demoListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '1rem',
    color: '#9ca3af'
  };

  const demoItemStyle = {
    fontFamily: 'monospace',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const footerStyle = {
    textAlign: 'center',
    marginTop: '40px',
    color: '#9ca3af',
    fontSize: '1rem'
  };

  const footerTextStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px'
  };

  const spinnerStyle = {
    width: '24px',
    height: '24px',
    border: '3px solid white',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: rgba(156, 163, 175, 0.7);
        }
        
        input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        
        button:hover:not(:disabled) {
          transform: scale(1.05);
        }
        
        .submit-button:hover:not(:disabled) {
          box-shadow: 0 15px 50px rgba(59, 130, 246, 0.4);
        }
        
        .demo-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .tab-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .password-toggle:hover {
          color: white;
        }
        
        .toggle-button:hover {
          color: #3b82f6;
        }

        @media (max-width: 768px) {
          .grid-container {
            grid-template-columns: 1fr;
          }
          
          .title {
            font-size: 3rem;
          }
          
          .floating-emoji {
            display: none;
          }
        }
      `}</style>
      
      <div style={containerStyle}>
        {/* Animated Background Blobs */}
        <div style={blobStyle1}></div>
        <div style={blobStyle2}></div>
        <div style={blobStyle3}></div>

        {/* Floating Elements */}
        <div style={{...floatingEmojiStyle, top: '8%', left: '8%', fontSize: '4.5rem', animationDuration: '6s'}}>💰</div>
        <div style={{...floatingEmojiStyle, top: '15%', right: '12%', fontSize: '3rem', animationDuration: '8s', animationDelay: '2s'}}>📊</div>
        <div style={{...floatingEmojiStyle, bottom: '15%', left: '10%', fontSize: '3.75rem', animationDuration: '10s', animationDelay: '4s'}}>💳</div>
        <div style={{...floatingEmojiStyle, bottom: '25%', right: '20%', fontSize: '2.5rem', animationDuration: '7s', animationDelay: '1s'}}>📈</div>

        {/* Main Container */}
        <div style={mainContainerStyle}>
          {/* Header Section */}
          <div style={headerStyle}>
            <div style={logoStyle}>
              <span style={{fontSize: '2.5rem'}}>💎</span>
            </div>
            <h1 style={titleStyle} className="title">SmartCents</h1>
            <p style={subtitleStyle}>
              {isLogin ? '✨ Welcome back! Ready to master your finances?' : '🚀 Join thousands making smarter financial decisions'}
            </p>
          </div>

          {/* Main Card */}
          <div style={cardStyle}>
            {/* Tab Switcher */}
            <div style={tabSwitcherStyle}>
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                style={isLogin ? activeTabStyle : inactiveTabStyle}
                className="tab-button"
              >
                🔐 Sign In
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                style={!isLogin ? activeTabStyle : inactiveTabStyle}
                className="tab-button"
              >
                ✨ Create Account
              </button>
            </div>

            <form onSubmit={handleSubmit} style={formStyle}>
              
              {/* Registration-only fields */}
              {!isLogin && (
                <div style={{display: 'flex', flexDirection: 'column', gap: '32px'}}>
                  <div>
                    <label htmlFor="name" style={labelStyle}>👤 Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      style={inputStyle}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div style={gridStyle} className="grid-container">
                    <div>
                      <label htmlFor="age" style={labelStyle}>🎂 Age</label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        required={!isLogin}
                        min="18"
                        max="120"
                        value={formData.age}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <label htmlFor="annual_income" style={labelStyle}>💰 Annual Income</label>
                      <input
                        type="number"
                        id="annual_income"
                        name="annual_income"
                        required={!isLogin}
                        min="0"
                        step="1000"
                        value={formData.annual_income}
                        onChange={handleChange}
                        style={inputStyle}
                        placeholder="$50,000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label htmlFor="email" style={labelStyle}>📧 Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" style={labelStyle}>🔒 Password</label>
                <div style={passwordContainerStyle}>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    minLength="6"
                    value={formData.password}
                    onChange={handleChange}
                    style={{...inputStyle, paddingRight: '56px'}}
                    placeholder="Enter your password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={passwordToggleStyle}
                    className="password-toggle"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm password field (registration only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="confirm_password" style={labelStyle}>🔐 Confirm Password</label>
                  <div style={passwordContainerStyle}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm_password"
                      name="confirm_password"
                      required={!isLogin}
                      minLength="6"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      style={{...inputStyle, paddingRight: '56px'}}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={passwordToggleStyle}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...submitButtonStyle,
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                className="submit-button"
              >
                {loading && <div style={spinnerStyle}></div>}
                <span>
                  {loading ? '⏳ Please wait...' : (isLogin ? '🚀 Sign In Now' : '✨ Create Account')}
                </span>
              </button>
            </form>

            {/* Demo Login (only on login tab) */}
            {isLogin && (
              <div>
                <div style={dividerStyle}>
                  <div style={dividerLineStyle}></div>
                  <div style={dividerTextStyle}>or try demo</div>
                </div>
                
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  style={{
                    ...demoButtonStyle,
                    opacity: loading ? 0.5 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                  className="demo-button"
                >
                  🎮 Try Demo Account
                </button>
              </div>
            )}

            {/* Toggle between login/register */}
            <div style={toggleStyle}>
              <p style={toggleTextStyle}>
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={toggleMode}
                  style={toggleButtonStyle}
                  className="toggle-button"
                >
                  {isLogin ? 'Create one here' : 'Sign in instead'}
                </button>
              </p>
            </div>

            {/* Demo credentials */}
            {isLogin && (
              <div style={demoCardStyle}>
                <p style={demoHeaderStyle}>
                  <span style={{fontSize: '1.25rem'}}>🔑</span>
                  Demo Credentials:
                </p>
                <div style={demoListStyle}>
                  <p style={demoItemStyle}>
                    <span>📧</span> john@example.com
                  </p>
                  <p style={demoItemStyle}>
                    <span>🔒</span> demo123
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={footerStyle}>
            <p style={footerTextStyle}>
              <span style={{fontSize: '1.25rem'}}>🔒</span>
              Secure financial management at your fingertips
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;