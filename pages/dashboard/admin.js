import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Database metrics
  const [metrics, setMetrics] = useState({
    players: 0,
    organisers: 0,
    tournaments: 0,
    matches: 0
  });

  // Admin approval states
  const [pendingOrganisers, setPendingOrganisers] = useState([]);
  const [pendingTournaments, setPendingTournaments] = useState([]);

  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };


  // Auth check
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
  }, [router]);

  // Load database entries
  useEffect(() => {
    if (!user) return;
    loadAdminDashboardData();
  }, [user]);

  async function loadAdminDashboardData() {
    try {
      // 1. Fetch metrics in parallel
      const [playersCount, organisersCount, tournamentsCount, matchesCount] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'PLAYER'),
        supabase.from('organiser_profiles').select('id', { count: 'exact', head: true }).eq('is_approved', true),
        supabase.from('tournaments').select('id', { count: 'exact', head: true }).eq('status', 'APPROVED'),
        supabase.from('matches').select('id', { count: 'exact', head: true })
      ]);

      setMetrics({
        players: playersCount.count || 0,
        organisers: organisersCount.count || 0,
        tournaments: tournamentsCount.count || 0,
        matches: matchesCount.count || 0
      });

      // 2. Fetch pending organisers
      const { data: orgs } = await supabase
        .from('organiser_profiles')
        .select('*, users(name, email)')
        .eq('is_approved', false);

      if (orgs) {
        setPendingOrganisers(orgs.map(o => ({
          id: o.id,
          name: o.organisation_name || o.users?.name || 'Academy Pending Name',
          contact: o.contact_phone || 'N/A',
          email: o.users?.email || 'N/A'
        })));
      }

      // 3. Fetch pending tournaments
      const { data: tourneys } = await supabase
        .from('tournaments')
        .select('*, organiser_profiles(organisation_name)')
        .eq('status', 'SUBMITTED');

      if (tourneys) {
        setPendingTournaments(tourneys.map(t => ({
          id: t.id,
          name: t.name,
          sport: t.sport,
          organiser: t.organiser_profiles?.organisation_name || 'Organiser Academy',
          date: t.tournament_start ? new Date(t.tournament_start).toLocaleDateString() : 'TBD'
        })));
      }

    } catch (err) {
      console.error("Error loading admin stats:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleApproveOrganiser = async (id, name) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('organiser_profiles')
        .update({ is_approved: true })
        .eq('id', id);

      if (error) throw error;

      showToast(`Organiser "${name}" has been approved!`);
      await loadAdminDashboardData();
    } catch (err) {
      showToast("Error approving organiser: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTournament = async (id, name) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'APPROVED' })
        .eq('id', id);

      if (error) throw error;

      showToast(`Tournament "${name}" has been approved and published live!`);
      
      // Auto seed leaderboard points for tournament sport and district if not exists
      await loadAdminDashboardData();
    } catch (err) {
      showToast("Error approving tournament: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
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
            <span className="text-white small d-none d-md-inline">Welcome, Administrator <strong>{user?.name}</strong></span>
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
              <h3 className="fw-bold text-navy m-0">{metrics.players}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Approved Organisers</span>
              <h3 className="fw-bold text-navy m-0">{metrics.organisers}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Active Tournaments</span>
              <h3 className="fw-bold text-navy m-0">{metrics.tournaments}</h3>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <span className="text-muted d-block small mb-1 text-uppercase fw-bold" style={{ fontSize: '.7rem', letterSpacing: '1px' }}>Total Matches Managed</span>
              <h3 className="fw-bold text-navy m-0">{metrics.matches}</h3>
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
