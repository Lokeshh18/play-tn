import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Register() {
  const router = useRouter();
  const [role, setRole] = useState('PLAYER'); // 'PLAYER', 'COACH', 'ORGANISER'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // States for verification flow
  const [showOtp, setShowOtp] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      // Proceed to OTP verification view
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

      // Success, save session and forward to dashboard
      localStorage.setItem('userSession', JSON.stringify(data.user));
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
        <title>Register Account &mdash; Play TN</title>
      </Head>

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
              <Link href="/" className="navbar-brand fs-1 text-decoration-none" style={{ color: 'var(--navy)', fontFamily: 'Bebas Neue', letterSpacing: '3px' }}>
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
                  {['PLAYER', 'COACH', 'ORGANISER'].map((r) => (
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
                  <h6 className="fw-bold mb-1" style={{ color: 'var(--navy)' }}>OTP Sent to Console logs</h6>
                  <p className="small text-muted mb-4">Please input the OTP generated for <strong>{email}</strong>. For demonstration bypass, use: <strong>123456</strong>.</p>
                  
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
                  {loading ? 'Verifying OTP...' : 'Verify Email & Complete Sign Up'}
                </button>
              </form>
            )}

            <div className="text-center mt-4">
              <span className="small text-muted">Already have an account? </span>
              <Link href="/login" className="small text-decoration-none fw-bold" style={{ color: 'var(--accent)' }}>
                Sign In
              </Link>
            </div>

          </div>
        </div>
      </div>

      <style jsx global>{`
        .bg-navy {
          background-color: var(--navy) !important;
        }
      `}</style>
    </>
  );
}
