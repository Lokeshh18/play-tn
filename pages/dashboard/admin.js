import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin approval states
  const [pendingOrganisers, setPendingOrganisers] = useState([
    { id: 10, name: "Kovai Sports Academy", contact: "Coimbatore", email: "kovaisports@example.com" },
    { id: 11, name: "Salem Club Association", contact: "Salem", email: "salemclub@example.com" },
  ]);

  const [pendingTournaments, setPendingTournaments] = useState([
    { id: 1, name: "Salem Athletics Qualifier", sport: "Athletics", organiser: "Salem Club Association", date: "05 Jul 2026" },
  ]);

  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (!session) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(session);
    if (userData.role !== 'ADMIN') {
      router.push(`/dashboard/${userData.role.toLowerCase()}`);
      return;
    }

    setUser(userData);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleApproveOrganiser = (id, name) => {
    setPendingOrganisers(pendingOrganisers.filter(org => org.id !== id));
    alert(`Organiser "${name}" has been approved!`);
  };

  const handleApproveTournament = (id, name) => {
    setPendingTournaments(pendingTournaments.filter(t => t.id !== id));
    alert(`Tournament "${name}" has been approved and published!`);
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard &mdash; Play TN</title>
      </Head>

      {/* NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, Administrator <strong>{user.name}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-warning rounded-pill btn-sm px-3">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <h2 className="fw-bold text-navy mb-1">Administrative Control Panel</h2>
        <p className="text-muted mb-5">Oversee platform sign ups, approve tournaments, and view state analytics.</p>

        {/* METRICS ROW */}
        <div className="row g-3 mb-5">
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Total Registered Players</span>
              <h3 className="fw-bold text-navy m-0">1,240</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Approved Organisers</span>
              <h3 className="fw-bold text-navy m-0">48</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Active Tournaments</span>
              <h3 className="fw-bold text-navy m-0">14</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Total Matches Managed</span>
              <h3 className="fw-bold text-navy m-0">186</h3>
            </div>
          </div>
        </div>

        <div className="row g-4">
          
          {/* TOURNAMENT APPROVAL CARD */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-navy mb-4">Pending Tournament Approvals</h5>
              {pendingTournaments.length === 0 ? (
                <p className="text-muted small">No tournaments waiting for review.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle table-borderless">
                    <thead>
                      <tr className="border-bottom text-muted small">
                        <th>Tournament</th>
                        <th>Organiser</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTournaments.map((t) => (
                        <tr key={t.id} className="border-bottom">
                          <td>
                            <strong className="d-block">{t.name}</strong>
                            <span className="small text-muted">{t.sport} &bull; {t.date}</span>
                          </td>
                          <td><small>{t.organiser}</small></td>
                          <td className="text-end">
                            <button 
                              onClick={() => handleApproveTournament(t.id, t.name)}
                              className="btn btn-success btn-sm rounded-pill px-3 fw-bold"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ORGANISER APPROVAL CARD */}
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-navy mb-4">Pending Organiser Approvals</h5>
              {pendingOrganisers.length === 0 ? (
                <p className="text-muted small">No organisers waiting for registration approval.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle table-borderless">
                    <thead>
                      <tr className="border-bottom text-muted small">
                        <th>Organiser / Academy</th>
                        <th>Location</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrganisers.map((o) => (
                        <tr key={o.id} className="border-bottom">
                          <td>
                            <strong className="d-block">{o.name}</strong>
                            <span className="small text-muted">{o.email}</span>
                          </td>
                          <td><small>{o.contact}</small></td>
                          <td className="text-end">
                            <button 
                              onClick={() => handleApproveOrganiser(o.id, o.name)}
                              className="btn btn-success btn-sm rounded-pill px-3 fw-bold"
                            >
                              Approve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}
