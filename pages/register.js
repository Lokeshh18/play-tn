import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState('PLAYER'); // 'PLAYER', 'ORGANISER', 'ADMIN'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // States for verification flow
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Toast state
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signup', name, email, password, role, phone })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      showToast(`Account verification OTP generated. Check email/logs!`);
      setShowOtp(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', email, otp: otpToken })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      showToast(`Account successfully verified! Logging in...`);
      localStorage.setItem('userSession', JSON.stringify(data.user));
      
      // Wait a moment for the toast to display, then route
      setTimeout(() => {
        router.push(`/dashboard/${data.user.role.toLowerCase()}`);
      }, 1500);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Register Account &mdash; Play TN</title>
      </Head>

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

      <div className="d-flex align-items-center justify-content-center min-vh-100" style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #0d3b9e 50%, var(--blue) 100%)',
        padding: '2rem 1rem'
      }}>
        <div className="card shadow-lg" style={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          border: 'none',
          overflow: 'hidden'
        }}>
          <div className="card-body p-4 p-md-5 bg-white">
            <div className="text-center mb-4">
              <Link href="/" className="fs-1 text-decoration-none fw-bold" style={{ color: 'var(--blue)', fontFamily: 'Bebas Neue', letterSpacing: '3px' }}>
                PLAY<span style={{ color: 'var(--gold)' }}>TN</span>
              </Link>
              <h5 className="fw-bold mt-2" style={{ color: 'var(--navy)' }}>Create Your Account</h5>
            </div>

            {error && (
              <div className="alert alert-danger py-2 px-3 fs-7 rounded-3" role="alert">
                {error}
              </div>
            )}

            {!showOtp ? (
              <form onSubmit={handleRegisterSubmit}>
                {/* Role Tabs */}
                <div className="d-flex gap-2 p-1 bg-light rounded-4 mb-4" style={{ border: '1px solid #e0eaf8' }}>
                  {['PLAYER', 'ORGANISER'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      className={`flex-grow-1 border-0 py-2 rounded-3 small fw-bold text-capitalize ${role === r ? 'bg-navy text-white' : 'bg-transparent text-muted'}`}
                      style={{ transition: 'all .2s' }}
                      onClick={() => setRole(r)}
                    >
                      {r.toLowerCase()}
                    </button>
                  ))}
                </div>

                <div className="mb-3">
                  <label className="form-label text-navy">Full Name</label>
                  <input
                    type="text"
                    className="form-control py-2"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

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
                  <label className="form-label text-navy">Mobile Number</label>
                  <input
                    type="tel"
                    className="form-control py-2"
                    placeholder="+91 XXXXX XXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                  {loading ? 'Creating Account...' : `Register as ${role.charAt(0) + role.slice(1).toLowerCase()}`}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpVerify}>
                <div className="mb-4 text-center">
                  <p className="small text-muted">Verify your signup. Check your email or console logs for the 6-digit OTP code.</p>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-control text-center fs-3 fw-bold tracking-widest py-2"
                    placeholder="000000"
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value)}
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
              <span className="small text-muted">Already have an account? </span>
              <Link href="/login" className="small text-decoration-none fw-bold" style={{ color: 'var(--accent)' }}>
                Sign In Instead
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
