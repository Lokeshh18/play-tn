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

  // Modal view for rosters
  const [viewingRostersTourneyId, setViewingRostersTourneyId] = useState(null);
  const [rosters, setRosters] = useState([]);

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

  const handlePosterChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      // Upload file to Supabase storage bucket 'tournament-posters'
      const { error: uploadError } = await supabase.storage
        .from('tournament-posters')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fallback to local Base64 cache for development bypass
        console.warn("Storage upload failed, falling back to Base64:", uploadError.message);
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewTournament(prev => ({
            ...prev,
            posterUrl: reader.result
          }));
          showNotification("Poster loaded locally.");
        };
        reader.readAsDataURL(file);
      } else {
        // Get public URL
        const { data } = supabase.storage
          .from('tournament-posters')
          .getPublicUrl(filePath);

        setNewTournament(prev => ({
          ...prev,
          posterUrl: data.publicUrl
        }));
        showNotification("Tournament poster uploaded successfully!");
      }
    } catch (err) {
      console.error("Poster upload error:", err);
      showNotification("Poster upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let dbPosterUrl = newTournament.posterUrl;
      
      if (newTournament.posterUrl && newTournament.posterUrl.startsWith('data:image/')) {
        const posterKey = `local_poster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(posterKey, newTournament.posterUrl);
        dbPosterUrl = posterKey;
      }

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
          poster_url: dbPosterUrl,
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

  const openRostersModal = (tId) => {
    setViewingRostersTourneyId(tId);
    const key = `local_team_registrations_${tId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setRosters(JSON.parse(stored));
      } catch (e) {
        console.error(e);
        setRosters([]);
      }
    } else {
      setRosters([]);
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
            <span className="text-white small d-none d-md-inline">Organiser Academy Portal</span>
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

      {/* MAIN CONTAINER */}
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold text-navy m-0">Hosted Tournaments</h2>
          <button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary rounded-pill px-4 fw-bold"
          >
            {showCreateForm ? 'Cancel Creation' : 'Create Tournament'}
          </button>
        </div>

        {showCreateForm ? (
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 bg-white">
            <h5 className="fw-bold text-navy mb-4">Launch New Tournament</h5>
            <form onSubmit={handleCreateSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold">Tournament Name</label>
                  <input 
                    type="text" className="form-control" placeholder="e.g. State Badminton Open"
                    value={newTournament.name}
                    onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                    autoComplete="new-password"
                    required 
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold">Select Sport</label>
                  <select 
                    className="form-select"
                    value={newTournament.sport}
                    onChange={(e) => setNewTournament({ ...newTournament, sport: e.target.value })}
                    required
                  >
                    <option value="">Select Sport</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Kabaddi">Kabaddi</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Handball">Handball</option>
                    <option value="Basketball">Basketball</option>
                  </select>
                </div>
                <div className="col-md-3">
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

                <div className="col-12">
                  <label className="form-label small fw-bold">Description</label>
                  <textarea 
                    className="form-control" rows="3" placeholder="Tournament Rules, prizes details..."
                    value={newTournament.description}
                    onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                    required
                  ></textarea>
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
                <div className="col-md-4">
                  <label className="form-label small fw-bold">Maps Location (Optional URL)</label>
                  <input 
                    type="url" className="form-control" placeholder="Google maps link"
                    value={newTournament.mapsLocation}
                    onChange={(e) => setNewTournament({ ...newTournament, mapsLocation: e.target.value })}
                    autoComplete="new-password"
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

                {/* Tournament Poster Upload */}
                <div className="col-12 mt-3">
                  <label className="form-label small fw-bold">Tournament Poster Image File</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    accept="image/*"
                    onChange={handlePosterChange}
                  />
                  <small className="text-muted d-block mt-1">Upload a banner or poster image to display on upcoming matches cards and admin reviews.</small>
                  {newTournament.posterUrl && (
                    <div className="mt-3">
                      <span className="small text-muted d-block mb-1">Poster Preview:</span>
                      <img 
                        src={newTournament.posterUrl} 
                        alt="Poster Preview" 
                        className="rounded shadow-sm border" 
                        style={{ height: '150px', objectFit: 'cover' }} 
                      />
                    </div>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-submit mt-4 py-3 rounded-pill text-uppercase">
                Submit Tournament for Admin Approval &rarr;
              </button>
            </form>
          </div>
        ) : (
          <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
            <h5 className="fw-bold text-navy mb-4 font-bebas" style={{ letterSpacing: '1px' }}>Tournament Listings</h5>
            <div className="table-responsive">
              {tournaments.length === 0 ? (
                <p className="text-muted small m-0 p-3 text-center">You haven&apos;t hosted any tournaments yet. Click Create Tournament to get started.</p>
              ) : (
                <table className="table align-middle">
                  <thead>
                    <tr className="text-muted small">
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
                        <td>
                          <span className="fw-bold text-primary">{t.registrations} Teams</span>
                          {t.registrations > 0 && (
                            <button 
                              onClick={() => openRostersModal(t.id)}
                              className="btn btn-link btn-sm text-decoration-none ms-2 fw-bold"
                              style={{ fontSize: '.8rem' }}
                            >
                              View Rosters &rarr;
                            </button>
                          )}
                        </td>
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

      {/* ROSTERS VIEW MODAL */}
      {viewingRostersTourneyId && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 bg-navy text-white p-4">
                <h5 className="modal-title fw-bold">Registered Team Roster Lists</h5>
                <button 
                  type="button" className="btn-close btn-close-white" 
                  onClick={() => setViewingRostersTourneyId(null)}
                ></button>
              </div>
              <div className="modal-body p-4 bg-light">
                {rosters.length === 0 ? (
                  <p className="text-muted text-center py-5">No detailed roster lists saved locally for this tournament yet.</p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {rosters.map((team, idx) => (
                      <div key={idx} className="card border-0 rounded-3 shadow-sm p-4 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="fw-bold text-navy m-0">Team: {team.teamName}</h5>
                          <span className="badge bg-success rounded-pill px-3 py-2 small">
                            Accommodation: {team.accommodation}
                          </span>
                        </div>
                        <p className="mb-2"><strong>Captain:</strong> {team.captainName} &bull; <strong>Contact:</strong> {team.mobile}</p>
                        <hr className="my-2" />
                        <h6 className="fw-bold text-muted small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Playing Members:</h6>
                        <div className="row g-2 mb-2">
                          {team.players.map((p, pIdx) => (
                            <div key={pIdx} className="col-sm-6 col-md-4">
                              <div className="p-2 border rounded bg-light text-truncate small">
                                {pIdx + 1}. {p}
                              </div>
                            </div>
                          ))}
                        </div>
                        {team.substitutes && team.substitutes.length > 0 && (
                          <>
                            <h6 className="fw-bold text-muted small text-uppercase mb-2" style={{ letterSpacing: '1px' }}>Substitutes:</h6>
                            <div className="row g-2">
                              {team.substitutes.map((s, sIdx) => (
                                <div key={sIdx} className="col-sm-6 col-md-4">
                                  <div className="p-2 border border-dashed rounded bg-white text-muted text-truncate small">
                                    Sub {sIdx + 1}. {s}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer border-0 p-3 bg-light">
                <button 
                  type="button" className="btn btn-secondary rounded-pill px-4" 
                  onClick={() => setViewingRostersTourneyId(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
