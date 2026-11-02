import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // <-- AuthContext import kiya
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth(); // <-- Login function nikala
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await login(email, password); // <-- API Call
      
      // Role ke hisaab se redirect
      if (data.data.role === 'Admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-overlay"></div>
        <div className="login-brand">
          <h1>GUJRAT SOLAR ENERGY</h1>
          <p>Turns Sunlight into Power</p>
        </div>
        <div className="login-info">
          <h2>Solar Business Management</h2>
          <p>Your complete solution to manage the entire solar business lifecycle under one roof.</p>
          <div className="login-features">
            <div className="feature-item"><FiCheckCircle className="feature-icon" /><span>Manage Customers & Leads</span></div>
            <div className="feature-item"><FiCheckCircle className="feature-icon" /><span>Generate Professional Quotations</span></div>
            <div className="feature-item"><FiCheckCircle className="feature-icon" /><span>Invoices, Payments & Payroll</span></div>
          </div>
        </div>
        <div className="login-footer-text">
          <p>© 2024 Gujrat Solar Energy. All rights reserved.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-container">
          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Login to access your dashboard</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-icon-wrapper">
                <FiMail className="input-icon" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-icon-wrapper">
                <FiLock className="input-icon" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </span>
              </div>
            </div>

            <div className="form-options">
              <label className="remember-me"><input type="checkbox" /> Remember me</label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login to Dashboard'}
            </button>
          </form>
          <div className="form-footer">
            <p>Don't have an account? <a href="#">Contact Admin</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;