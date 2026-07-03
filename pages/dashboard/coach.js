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


export default function CoachDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trainees, setTrainees] = useState([]);

  const [profile, setProfile] = useState({
    certifications: '',
    specialization: '',
    experience: '',
    district: '',
    bio: ''
  });

  const [editing, setEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({ ...profile });

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
    if (userData.role !== 'COACH') {
      router.push(`/dashboard/${userData.role.toLowerCase()}`);
      return;
    }

    setUser(userData);
  }, [router]);

  // Load database entries
  useEffect(() => {
    if (!user) return;

    async function loadCoachData() {
      // 1. Fetch Coach Profile
      const { data: profileData } = await supabase
        .from('coach_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        const mapped = {
          certifications: profileData.certifications || '',
          specialization: profileData.specialization || '',
          experience: profileData.experience || '',
          district: profileData.district || '',
          bio: profileData.bio || ''
        };
        setProfile(mapped);
        setUpdatedProfile(mapped);
      }

      setLoading(false);
    }

    loadCoachData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('coach_profiles')
        .upsert({
          id: user.id,
          certifications: updatedProfile.certifications,
          specialization: updatedProfile.specialization,
          experience: updatedProfile.experience,
          district: updatedProfile.district,
          bio: updatedProfile.bio
        });

      if (error) throw error;

      setProfile(updatedProfile);
      setEditing(false);
      showToast("Coach details updated successfully!");
    } catch (err) {
      showToast("Error saving coach profile: " + err.message);
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
        <title>Coach Dashboard &mdash; Play TN</title>
      </Head>

      {/* NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, Coach <strong>{user?.name}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-warning rounded-pill btn-sm px-3">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row g-4">
          
          {/* PROFILE SUMMARY */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <div className="position-relative d-inline-block mx-auto mb-3" style={{ width: '120px', height: '120px' }}>
                <div className="rounded-circle bg-navy d-flex align-items-center justify-content-center text-white fw-bold fs-1 w-100 h-100">
                  {user?.name?.charAt(0)}
                </div>
              </div>
              <h4 className="fw-bold text-navy mb-1">{user?.name}</h4>
              <span className="badge bg-primary rounded-pill mb-3" style={{ fontSize: '.75rem', letterSpacing: '1px' }}>
                CERTIFIED COACH
              </span>
              <p className="small text-muted">{user?.email}</p>
              <hr />
              <div className="text-start">
                <p className="small mb-2"><strong>Specialization:</strong> {profile.specialization || 'Not set'}</p>
                <p className="small mb-2"><strong>Experience:</strong> {profile.experience || 'Not set'}</p>
                <p className="small mb-2"><strong>Certifications:</strong> {profile.certifications || 'None listed'}</p>
                <p className="small mb-0"><strong>District:</strong> {profile.district || 'Not set'}</p>
              </div>
              <button 
                onClick={() => { setEditing(!editing); setUpdatedProfile({ ...profile }); }}
                className="btn btn-outline-primary rounded-pill w-100 mt-4 btn-sm fw-bold"
              >
                {editing ? 'Cancel Editing' : 'Edit Coach Details'}
              </button>
            </div>
          </div>

          {/* DYNAMIC CARD VIEW */}
          <div className="col-lg-8">
            {editing ? (
              <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 bg-white">
                <h5 className="fw-bold text-navy mb-4">Edit Coach Profile</h5>
                <form onSubmit={handleSaveProfile}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Specialization</label>
                      <input 
                        type="text" className="form-control"
                        value={updatedProfile.specialization}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, specialization: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Experience</label>
                      <input 
                        type="text" className="form-control" placeholder="e.g. 5 Years"
                        value={updatedProfile.experience}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, experience: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-md-12">
                      <label className="form-label small fw-bold">District</label>
                      <select 
                        className="form-select"
                        value={updatedProfile.district}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, district: e.target.value })}
                        required
                      >
                        <option value="">Select District</option>
                        {TAMIL_NADU_DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Certifications</label>
                      <input 
                        type="text" className="form-control"
                        value={updatedProfile.certifications}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, certifications: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Bio</label>
                      <textarea 
                        className="form-control" rows="3"
                        value={updatedProfile.bio}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, bio: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                  <button type="submit" className="btn-submit mt-4 rounded-pill py-2">Save Profile Updates</button>
                </form>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                
                {/* TRAINEE LIST */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Trainees / Athletes List</h5>
                  <div className="table-responsive">
                    {trainees.length === 0 ? (
                      <p className="text-muted small m-0 p-3 text-center">No trainee athletes currently assigned to your coaching dashboard.</p>
                    ) : (
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Athlete Name</th>
                            <th>Sport</th>
                            <th>Performance Rating</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trainees.map(t => (
                            <tr key={t.id}>
                              <td><strong>{t.name}</strong></td>
                              <td>{t.sport}</td>
                              <td>{t.rating} / 10</td>
                              <td><span className="badge bg-success rounded-pill">Active Training</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* SCHEDULED SESSIONS */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Upcoming Training Sessions</h5>
                  <p className="text-muted small m-0 p-3 text-center">No upcoming training sessions scheduled. Edit profile to link contact options.</p>
                </div>

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
