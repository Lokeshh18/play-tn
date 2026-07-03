import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Forgot/Reset Password States
  const [forgotView, setForgotView] = useState(false);
  const [showResetView, setShowResetView] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          // Unverified account
          setPendingEmail(email);
          setShowOtpModal(true);
          throw new Error('Account needs verification. Please enter the OTP sent during sign up.');
        }
        throw new Error(data.error || 'Login failed');
      }

      // Success
      localStorage.setItem('userSession', JSON.stringify(data.user));
      router.push(`/dashboard/${data.user.role.toLowerCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', email: pendingEmail, otp: otpCode })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Success, automatically log in
      localStorage.setItem('userSession', JSON.stringify(data.user));
      setShowOtpModal(false);
      router.push(`/dashboard/${data.user.role.toLowerCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit reset request');
      }

      showToast("OTP verification token generated! Check server logs.");
      setShowResetView(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email, otp: resetOtp, password: newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Reset failed');
      }

      showToast("Password has been reset successfully! You can now sign in.");
      setForgotView(false);
      setShowResetView(false);
      setPassword('');
      setResetOtp('');
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In &mdash; Play TN</title>
      </Head>

      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #0d3b9e 50%, var(--blue) 100%)',
        padding: '2rem 1rem'
      }}>
        <div className="card shadow-lg" style={{
          width: '100%',
          maxWidth: '430px',
          borderRadius: '24px',
          border: 'none',
          overflow: 'hidden'
        }}>
          <div className="card-body p-4 p-md-5 bg-white">
            <div className="text-center mb-4">
              <Link href="/" className="fs-1 text-decoration-none fw-bold" style={{ color: 'var(--blue)', fontFamily: 'Bebas Neue', letterSpacing: '3px' }}>
                PLAY<span style={{ color: 'var(--gold)' }}>TN</span>
              </Link>
              <h5 className="fw-bold mt-2" style={{ color: 'var(--navy)' }}>
                {forgotView ? 'Reset Your Password' : 'Sign In to Your Account'}
              </h5>
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 fs-7 rounded-3" role="alert">
                {error}
              </div>
            )}

            {/* FORGOT PASSWORD SECTION */}
            {forgotView ? (
              !showResetView ? (
                <form onSubmit={handleForgotSubmit}>
                  <p className="small text-muted mb-4">Enter your registered email address to request a verification OTP.</p>
                  <div className="mb-4">
                    <label className="form-label text-navy">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-submit py-2 w-100" disabled={loading}>
                    {loading ? 'Submitting...' : 'Send Verification OTP'}
                  </button>

                  <div className="text-center mt-3">
                    <button type="button" onClick={() => setForgotView(false)} className="btn btn-link text-decoration-none btn-sm fw-bold" style={{ color: 'var(--muted)' }}>
                      &larr; Back to Login
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-navy">6-Digit Verification OTP</label>
                    <input
                      type="text"
                      maxLength="6"
                      className="form-control text-center py-2 fw-bold tracking-widest fs-5"
                      placeholder="000000"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-navy">New Password</label>
                    <input
                      type="password"
                      className="form-control py-2"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-submit py-2 w-100" disabled={loading}>
                    {loading ? 'Resetting Password...' : 'Verify & Reset Password'}
                  </button>
                </form>
              )
            ) : (
              /* LOGIN & OTP SECTIONS */
              !showOtpModal ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-navy">Email Address</label>
                    <input
                      type="email"
                      className="form-control py-2"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <label className="form-label text-navy">Password</label>
                      <button type="button" onClick={() => setForgotView(true)} className="btn btn-link p-0 text-decoration-none btn-sm fw-bold border-0 bg-transparent" style={{ color: 'var(--accent)', fontSize: '.83rem' }}>
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      className="form-control py-2"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit py-2 w-100" 
                    disabled={loading}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleOtpSubmit}>
                  <div className="mb-4 text-center">
                    <p className="small text-muted">Please enter verification OTP sent to your email/logs.</p>
                    <input
                      type="text"
                      maxLength="6"
                      className="form-control text-center fs-3 fw-bold tracking-widest py-2"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-submit py-2 w-100" 
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </form>
              )
            )}

            {!forgotView && (
              <div className="text-center mt-4">
                <span className="small text-muted">Don&apos;t have an account? </span>
                <Link href="/register" className="small text-decoration-none fw-bold" style={{ color: 'var(--accent)' }}>
                  Register Here
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* TOAST MESSAGE */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 m-4 p-3 rounded-4 shadow-lg text-white" style={{
          background: 'var(--navy)',
          borderLeft: '5px solid var(--gold)',
          zIndex: 1050,
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <div className="d-flex align-items-center gap-2">
            <span>🎉</span>
            <span className="fw-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
