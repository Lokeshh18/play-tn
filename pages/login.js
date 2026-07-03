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
              <Link href="/" className="navbar-brand fs-1 text-decoration-none" style={{ color: 'var(--navy)', fontFamily: 'Bebas Neue', letterSpacing: '3px' }}>
                PLAY<span style={{ color: 'var(--gold)' }}>TN</span>
              </Link>
              <h5 className="fw-bold mt-2" style={{ color: 'var(--navy)' }}>Sign In to Your Account</h5>
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 fs-7 rounded-3" role="alert">
                {error}
              </div>
            )}

            {!showOtpModal ? (
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

                <div className="mb-4">
                  <label className="form-label text-navy">Password</label>
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
                  <p className="small text-muted">Please enter verification OTP. If reviewing this project, use the fallback code <strong>123456</strong>.</p>
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
            )}

            <div className="text-center mt-4">
              <span className="small text-muted">Don&apos;t have an account? </span>
              <Link href="/register" className="small text-decoration-none fw-bold" style={{ color: 'var(--accent)' }}>
                Register Here
              </Link>
            </div>

            {/* Recruiter Credentials Cheat Sheet */}
            <div className="mt-4 p-3 rounded-3" style={{ background: '#f0f6ff', border: '1px solid #c8daf5' }}>
              <h6 className="fw-bold mb-2 text-center" style={{ color: 'var(--navy)', fontSize: '.82rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🔑 Quick Demo Credentials
              </h6>
              <div className="small" style={{ fontSize: '.75rem', color: 'var(--text)' }}>
                <div className="d-flex justify-content-between mb-1">
                  <span><strong>Player:</strong> player@playtn.in</span>
                  <span className="text-muted">pass: password</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span><strong>Organizer:</strong> organiser@playtn.in</span>
                  <span className="text-muted">pass: password</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span><strong>Admin:</strong> admin@playtn.in</span>
                  <span className="text-muted">pass: password</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
