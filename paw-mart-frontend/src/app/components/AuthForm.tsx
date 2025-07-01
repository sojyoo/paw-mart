"use client";

import React, { useState } from 'react';

const API_BASE = 'http://localhost:4000/api/auth';

interface UserInfo {
  email: string;
  role: string;
  name: string;
}

interface AuthFormProps {
  onLoginSuccess?: (token: string, user: UserInfo) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [skipOtpForAdmin, setSkipOtpForAdmin] = useState(false);
  const [isBuyerRegistration, setIsBuyerRegistration] = useState(false);

  const fetchUserInfo = async (token: string): Promise<UserInfo | null> => {
    try {
      const res = await fetch('http://localhost:4000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      return { email: data.user.email, role: data.user.role, name: data.user.name };
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (forgotMode) {
        // Forgot password request
        const res = await fetch(`${API_BASE}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Failed to send reset email');
        setSuccess('OTP sent to your email. Enter it below to reset your password.');
        setForgotMode(false);
        setResetMode(true);
      } else if (resetMode) {
        // Reset password request
        const res = await fetch(`${API_BASE}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, newPassword: password, otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'Failed to reset password');
        setSuccess('Password reset successful! You can now log in.');
        setResetMode(false);
        setShowOtp(false);
        setIsLogin(true);
      } else if (showOtp) {
        // OTP verification
        const res = await fetch(`${API_BASE}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || 'OTP verification failed');
        setSuccess(isBuyerRegistration ? 'Registration complete! Your account is pending admin approval.' : 'Login successful!');
        setShowOtp(false);
        // Save session/token, handle rememberMe
        if (data.token) {
          if (rememberMe) {
            localStorage.setItem('pawmart_token', data.token);
          } else {
            sessionStorage.setItem('pawmart_token', data.token);
          }
          // Fetch user info and pass to parent
          const user = await fetchUserInfo(data.token);
          if (onLoginSuccess && user) onLoginSuccess(data.token, user);
        }
      } else {
        // Login or Register - use admin endpoints if in admin mode
        let endpoint, body;
        if (isAdminLogin) {
          endpoint = '/admin-login';
          body = { email, password };
        } else {
          endpoint = isLogin ? '/login' : '/register';
          body = isLogin ? { email, password } : { email, password, name };
        }
        
        const res = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || (isLogin ? 'Login failed' : 'Registration failed'));
        
        // If admin login and skip OTP is enabled, directly create a mock token and login
        if (isAdminLogin && skipOtpForAdmin) {
          // Use the development endpoint for admin login without OTP
          const devRes = await fetch(`${API_BASE}/admin-login-dev`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          const devData = await devRes.json();
          if (!devRes.ok) throw new Error(devData.error || 'Admin dev login failed');
          
          setSuccess('Admin login successful! (OTP bypassed)');
          if (devData.token) {
            if (rememberMe) {
              localStorage.setItem('pawmart_token', devData.token);
            } else {
              sessionStorage.setItem('pawmart_token', devData.token);
            }
            // Use the real user info from the response
            const user = { email: devData.user.email, role: devData.user.role, name: devData.user.name };
            if (onLoginSuccess) onLoginSuccess(devData.token, user);
          }
        } else {
          setSuccess(data.message || (isLogin ? 'OTP sent to your email.' : 'Registration successful! OTP sent.'));
          setShowOtp(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-900">
        {forgotMode ? 'Forgot Password' : resetMode ? 'Reset Password' : isLogin ? 'Login to PawMart' : 'Register for PawMart'}
      </h2>
      {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2 text-center text-base">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-2 text-center text-base">{success}</div>}
      {isAdminLogin && (
        <div className="text-center text-blue-700 mb-2 text-sm font-medium">Enter your admin credentials below.</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && !forgotMode && !resetMode && (
          <input
            type="text"
            placeholder="Name"
            className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 bg-white"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            disabled={loading}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 bg-white"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        {(!showOtp && !forgotMode && !resetMode) && (
          <input
            type="password"
            placeholder="Password"
            className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 bg-white"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        )}
        {showOtp && !resetMode && (
          <input
            type="text"
            placeholder="Enter OTP"
            className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 bg-white"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            required
            disabled={loading}
          />
        )}
        {resetMode && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 bg-white"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              required
              disabled={loading}
            />
            <input
              type="password"
              placeholder="New Password"
              className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-500 bg-white"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </>
        )}
        {(!showOtp && !forgotMode && !resetMode) && (
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor="rememberMe" className="text-sm text-gray-900">Remember me</label>
          </div>
        )}
        {isAdminLogin && !showOtp && !forgotMode && !resetMode && (
          <div className="flex items-center">
            <input
              id="skipOtpForAdmin"
              type="checkbox"
              checked={skipOtpForAdmin}
              onChange={e => setSkipOtpForAdmin(e.target.checked)}
              className="mr-2"
              disabled={loading}
            />
            <label htmlFor="skipOtpForAdmin" className="text-sm text-orange-600 font-medium">🚀 Skip OTP (Dev Mode)</label>
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 text-base font-semibold"
          disabled={loading}
        >
          {loading
            ? 'Please wait...'
            : forgotMode
            ? 'Send OTP'
            : resetMode
            ? 'Reset Password'
            : showOtp && !resetMode
            ? 'Verify OTP'
            : isLogin
            ? 'Login'
            : 'Register'}
        </button>
      </form>
      <div className="text-center mt-4">
        <button
          className="text-blue-700 hover:underline mr-4 text-base"
          onClick={() => {
            setForgotMode(true);
            setError(null);
            setSuccess(null);
            setShowOtp(false);
            setResetMode(false);
          }}
          disabled={loading}
          type="button"
        >
          Forgot password?
        </button>
        <div style={{ marginTop: '2.5rem' }}>
          {isAdminLogin ? (
            <button
              type="button"
              className="text-green-700 hover:underline text-base mt-2 bg-transparent border-none p-0"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => {
                setIsBuyerRegistration(true);
                setIsLogin(false);
                setIsAdminLogin(false);
                setError(null);
                setSuccess(null);
                setShowOtp(false);
                setResetMode(false);
              }}
            >
              Register as Buyer
            </button>
          ) : isBuyerRegistration ? (
            <button
              type="button"
              className="text-blue-700 hover:underline text-base mt-2 bg-transparent border-none p-0"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              onClick={() => {
                setIsAdminLogin(true);
                setIsBuyerRegistration(false);
                setIsLogin(true);
                setError(null);
                setSuccess(null);
                setShowOtp(false);
                setResetMode(false);
                setEmail('admin@example.com');
              }}
            >
              Login as Admin
            </button>
          ) : (
            <>
              <button
                type="button"
                className="text-blue-700 hover:underline text-base mt-2 bg-transparent border-none p-0"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => {
                  setIsAdminLogin(true);
                  setIsBuyerRegistration(false);
                  setIsLogin(true);
                  setError(null);
                  setSuccess(null);
                  setShowOtp(false);
                  setResetMode(false);
                  setEmail('admin@example.com');
                }}
              >
                Login as Admin
              </button>
              <button
                type="button"
                className="text-green-700 hover:underline text-base mt-2 ml-4 bg-transparent border-none p-0"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                onClick={() => {
                  setIsBuyerRegistration(true);
                  setIsLogin(false);
                  setIsAdminLogin(false);
                  setError(null);
                  setSuccess(null);
                  setShowOtp(false);
                  setResetMode(false);
                }}
              >
                Register as Buyer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm; 