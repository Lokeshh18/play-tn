import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';

export default function OrganiserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([
    { id: 1, name: "District Cricket Tournament", status: "APPROVED", sport: "Cricket", date: "10 Jun 2026", registrations: 12 },
    { id: 2, name: "Salem Athletics Qualifier", status: "DRAFT", sport: "Athletics", date: "05 Jul 2026", registrations: 0 },
  ]);

  // Form state for creating a tournament
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTournament, setNewTournament] = useState({
    name: '', description: '', sport: 'Cricket', format: 'SINGLE_ELIMINATION',
    district: 'Salem', venue: '', mapsLocation: '',
    registrationStart: '', registrationEnd: '',
    tournamentStart: '', tournamentEnd: '',
    entryFee: '0', prizePool: '0', minTeams: '4', maxTeams: '16',
    contact1: '', contact2: '', email: '', rulesPdfUrl: '', posterUrl: ''
  });

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
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    // Add to local state (for demo/mock purposes)
    const created = {
      id: tournaments.length + 1,
      name: newTournament.name,
      status: "SUBMITTED", // Pending Admin Review
      sport: newTournament.sport,
      date: newTournament.tournamentStart || "TBD",
      registrations: 0
    };

    setTournaments([...tournaments, created]);
    setShowCreateForm(false);
    
    alert(`Tournament "${newTournament.name}" has been created and submitted to Admin for Review!`);

    // Attempt real database insert if Supabase configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co') {
      try {
        const { error } = await supabase.from('tournaments').insert([{
          name: newTournament.name,
          description: newTournament.description,
          sport: newTournament.sport,
          organiser_id: user.id,
          format: newTournament.format,
          district: newTournament.district,
          venue: newTournament.venue,
          maps_location: newTournament.mapsLocation,
          registration_start: newTournament.registrationStart,
          registration_end: newTournament.registrationEnd,
          tournament_start: newTournament.tournamentStart,
          tournament_end: newTournament.tournamentEnd,
          entry_fee: parseFloat(newTournament.entryFee),
          prize_pool: parseFloat(newTournament.prizePool),
          min_teams: parseInt(newTournament.minTeams),
          max_teams: parseInt(newTournament.maxTeams),
          status: 'SUBMITTED'
        }]);

        if (error) throw error;
      } catch (err) {
        console.error("Supabase insert failed:", err.message);
      }
    }

    // Reset Form
    setNewTournament({
      name: '', description: '', sport: 'Cricket', format: 'SINGLE_ELIMINATION',
      district: 'Salem', venue: '', mapsLocation: '',
      registrationStart: '', registrationEnd: '',
      tournamentStart: '', tournamentEnd: '',
      entryFee: '0', prizePool: '0', minTeams: '4', maxTeams: '16',
      contact1: '', contact2: '', email: '', rulesPdfUrl: '', posterUrl: ''
    });
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
        <title>Organiser Dashboard &mdash; Play TN</title>
      </Head>

      {/* NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, Organiser <strong>{user.name}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-warning rounded-pill btn-sm px-3">
              Logout
            </button>
          </div>
        </div>
      </nav>

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
            <form onSubmit={handleCreateSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament Name</label>
                  <input 
                    type="text" className="form-control" placeholder="e.g. Salem Open Football Championship"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    required 
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Select Sport</label>
                  <select 
                    className="form-select"
                    value={newTournament.sport}
                    onChange={(e) => setNewTournament({ ...newTournament, sport: e.target.value })}
                  >
                    <option>Cricket</option>
                    <option>Football</option>
                    <option>Volleyball</option>
                    <option>Kabaddi</option>
                    <option>Badminton</option>
                    <option>Athletics</option>
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
                  >
                    <option>Salem</option>
                    <option>Chennai</option>
                    <option>Coimbatore</option>
                    <option>Madurai</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Format</label>
                  <select 
                    className="form-select"
                    value={newTournament.format}
                    onChange={(e) => setNewTournament({ ...newTournament, format: e.target.value })}
                  >
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
                    required 
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Registration Start Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.registrationStart}
                    onChange={(e) => setNewTournament({ ...newTournament, registrationStart: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Registration End Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.registrationEnd}
                    onChange={(e) => setNewTournament({ ...newTournament, registrationEnd: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament Start Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.tournamentStart}
                    onChange={(e) => setNewTournament({ ...newTournament, tournamentStart: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament End Date</label>
                  <input 
                    type="datetime-local" className="form-control"
                    value={newTournament.tournamentEnd}
                    onChange={(e) => setNewTournament({ ...newTournament, tournamentEnd: e.target.value })}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-bold">Entry Fee (₹)</label>
                  <input 
                    type="number" className="form-control" placeholder="0 for Free"
                    value={newTournament.entryFee}
                    onChange={(e) => setNewTournament({ ...newTournament, entryFee: e.target.value })}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Prize Pool (₹)</label>
                  <input 
                    type="number" className="form-control" placeholder="Pool amount"
                    value={newTournament.prizePool}
                    onChange={(e) => setNewTournament({ ...newTournament, prizePool: e.target.value })}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label small fw-bold">Contact Email</label>
                  <input 
                    type="email" className="form-control" placeholder="contact@example.com"
                    value={newTournament.email}
                    onChange={(e) => setNewTournament({ ...newTournament, email: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Contact Phone 1</label>
                  <input 
                    type="tel" className="form-control" placeholder="Mobile 1"
                    value={newTournament.contact1}
                    onChange={(e) => setNewTournament({ ...newTournament, contact1: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Contact Phone 2</label>
                  <input 
                    type="tel" className="form-control" placeholder="Mobile 2"
                    value={newTournament.contact2}
                    onChange={(e) => setNewTournament({ ...newTournament, contact2: e.target.value })}
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
            <h5 className="fw-bold text-navy mb-4">My Hosted Tournaments</h5>
            <div className="table-responsive">
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
                      <td>{t.registrations} Teams</td>
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}
