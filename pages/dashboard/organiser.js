import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", 
  "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", 
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", 
  "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];

const TEAM_SPORTS = ["Cricket", "Football", "Volleyball", "Kabaddi", "Handball", "Basketball"];

export default function OrganiserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  
  // Toast Notification State
  const [toast, setToast] = useState({ show: false, message: '' });

  // Form state for creating a tournament - all values empty by default
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '', description: '', sport: '', format: '',
    district: '', venue: '', mapsLocation: '',
    registrationStart: '', registrationEnd: '',
    tournamentStart: '', tournamentEnd: '',
    entryFee: '', prizePool: '', minTeams: '', maxTeams: '',
    contact1: '', contact2: '', email: '', rulesPdfUrl: '', posterUrl: ''
  });

  // Auth check
  useEffect(() => {
    const session = localStorage.getItem('userSession');
    if (!session) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(session);
    if (userData.role !== 'ORGANISER') {
      router.push(`/dashboard/${userData.role.toLowerCase()}`);
      return;
    }

    setUser(userData);
  }, [router]);

  // Load database entries
  useEffect(() => {
    if (!user) return;
    loadTournaments();
  }, [user]);

  async function loadTournaments() {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, tournament_registrations(count)')
        .eq('organiser_id', user.id);

      if (error) throw error;

      if (data) {
        setTournaments(data.map(t => ({
          id: t.id,
          name: t.name,
          status: t.status,
          sport: t.sport,
          date: t.tournament_start ? new Date(t.tournament_start).toLocaleDateString() : 'TBD',
          registrations: t.tournament_registrations?.[0]?.count || 0
        })));
      }
    } catch (err) {
      console.error("Error fetching tournaments:", err.message);
    } finally {
      setLoading(false);
    }
  }

  const showNotification = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tournaments')
        .insert([{
          name: newTournament.name,
          description: newTournament.description,
          sport: newTournament.sport,
          organiser_id: user.id,
          format: newTournament.format,
          district: newTournament.district,
          venue: newTournament.venue,
          maps_location: newTournament.mapsLocation,
          registration_start: newTournament.registrationStart || new Date().toISOString(),
          registration_end: newTournament.registrationEnd || new Date().toISOString(),
          tournament_start: newTournament.tournamentStart || new Date().toISOString(),
          tournament_end: newTournament.tournamentEnd || new Date().toISOString(),
          entry_fee: parseFloat(newTournament.entryFee) || 0.00,
          prize_pool: parseFloat(newTournament.prizePool) || 0.00,
          min_teams: parseInt(newTournament.minTeams) || null,
          max_teams: parseInt(newTournament.maxTeams) || null,
          status: 'SUBMITTED'
        }]);

      if (error) throw error;

      showNotification(`Tournament "${newTournament.name}" submitted to Admin for Review!`);
      setShowCreateForm(false);
      
      await loadTournaments();

      // Reset Form fields
      setNewTournament({
        name: '', description: '', sport: '', format: '',
        district: '', venue: '', mapsLocation: '',
        registrationStart: '', registrationEnd: '',
        tournamentStart: '', tournamentEnd: '',
        entryFee: '', prizePool: '', minTeams: '', maxTeams: '',
        contact1: '', contact2: '', email: '', rulesPdfUrl: '', posterUrl: ''
      });

    } catch (err) {
      showNotification("Error creating tournament: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isTeamSport = TEAM_SPORTS.includes(newTournament.sport);

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
        <title>Organiser Dashboard &mdash; Play TN</title>
      </Head>

      {/* NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, Organiser <strong>{user?.name}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-warning rounded-pill btn-sm px-3">
              Logout
            </button>
          </div>
        </div>
      </nav>

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

      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold text-navy">Organiser Portal</h2>
            <p className="text-muted m-0">Manage, create, and review tournament details.</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm"
          >
            {showCreateForm ? 'View Tournaments' : '➕ Create Tournament'}
          </button>
        </div>

        {showCreateForm ? (
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 bg-white">
            <h4 className="fw-bold text-navy mb-4">Launch New Tournament</h4>
            <form onSubmit={handleCreateSubmit} autoComplete="off">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament Name</label>
                  <input 
                    type="text" className="form-control" placeholder="e.g. Salem Open Football Championship"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    autoComplete="new-password"
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Select Sport</label>
                  <select 
                    className="form-select"
                    value={newTournament.sport}
                    onChange={(e) => setNewTournament({ ...newTournament, sport: e.target.value })}
                    required
                  >
                    <option value="">Select Sport</option>
                    <option>Cricket</option>
                    <option>Football</option>
                    <option>Volleyball</option>
                    <option>Kabaddi</option>
                    <option>Badminton</option>
                    <option>Athletics</option>
                    <option>Handball</option>
                    <option>Basketball</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label small fw-bold">Description / Guidelines</label>
                  <textarea 
                    className="form-control" rows="3" placeholder="Enter tournament details, venue guidelines..."
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">District</label>
                  <select 
                    className="form-select"
                    value={newTournament.district}
                    onChange={(e) => setNewTournament({ ...newTournament, district: e.target.value })}
                    required
                  >
                    <option value="">Select District</option>
                    {TAMIL_NADU_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Format</label>
                  <select 
                    className="form-select"
                    value={newTournament.format}
                    onChange={(e) => setNewTournament({ ...newTournament, format: e.target.value })}
                    required
                  >
                    <option value="">Select Format</option>
                    <option value="SINGLE_ELIMINATION">Knockout (Single Elimination)</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="LEAGUE">League</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Venue</label>
                  <input 
                    type="text" className="form-control" placeholder="Ground/Stadium Name"
                    value={newTournament.venue}
                    onChange={(e) => setNewTournament({ ...newTournament, venue: e.target.value })}
                    autoComplete="new-password"
                    required 
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Registration Start Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.registrationStart}
                    onChange={(e) => setNewTournament({ ...newTournament, registrationStart: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Registration End Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.registrationEnd}
                    onChange={(e) => setNewTournament({ ...newTournament, registrationEnd: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament Start Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.tournamentStart}
                    onChange={(e) => setNewTournament({ ...newTournament, tournamentStart: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament End Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.tournamentEnd}
                    onChange={(e) => setNewTournament({ ...newTournament, tournamentEnd: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">
                    {isTeamSport ? 'Team Entry Fee (₹)' : 'Entry Fee (₹)'}
                  </label>
                  <input 
                    type="number" className="form-control" placeholder="0 for Free"
                    value={newTournament.entryFee}
                    onChange={(e) => setNewTournament({ ...newTournament, entryFee: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Prize Pool (₹)</label>
                  <input 
                    type="number" className="form-control" placeholder="Pool amount"
                    value={newTournament.prizePool}
                    onChange={(e) => setNewTournament({ ...newTournament, prizePool: e.target.value })}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Contact Email</label>
                  <input 
                    type="email" className="form-control" placeholder="contact@example.com"
                    value={newTournament.email}
                    onChange={(e) => setNewTournament({ ...newTournament, email: e.target.value })}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Contact Phone 1</label>
                  <input 
                    type="tel" className="form-control" placeholder="Mobile 1"
                    value={newTournament.contact1}
                    onChange={(e) => setNewTournament({ ...newTournament, contact1: e.target.value })}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Contact Phone 2</label>
                  <input 
                    type="tel" className="form-control" placeholder="Mobile 2"
                    value={newTournament.contact2}
                    onChange={(e) => setNewTournament({ ...newTournament, contact2: e.target.value })}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="btn-submit mt-4 py-3 rounded-pill text-uppercase">
                Submit Tournament for Admin Approval &rarr;
              </button>
            </form>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-navy mb-4">Hosted Tournaments</h5>
            <div className="table-responsive">
              {tournaments.length === 0 ? (
                <p className="text-muted small m-0 p-3 text-center">You haven&apos;t hosted any tournaments yet. Click Create Tournament to get started.</p>
              ) : (
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Tournament Title</th>
                      <th>Sport</th>
                      <th>Date</th>
                      <th>Registrations</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t.id}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.sport}</td>
                        <td>{t.date}</td>
                        <td>{t.registrations} Registrations</td>
                        <td>
                          <span className={`badge rounded-pill ${
                            t.status === 'APPROVED' ? 'bg-success' : 
                            t.status === 'SUBMITTED' ? 'bg-warning text-dark' : 'bg-secondary'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
