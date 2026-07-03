import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CoachDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    certifications: 'National Level Certificate in Cricket Coaching',
    specialization: 'Batting Technique & Strength Conditioning',
    experience: '8 Years',
    district: 'Salem',
    bio: 'Former state cricketer dedicated to training the next generation of athletes.'
  });

  const [editing, setEditing] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({ ...profile });

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
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(updatedProfile);
    setEditing(false);
    alert("Coach profile details updated successfully!");
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
        <title>Coach Dashboard &mdash; Play TN</title>
      </Head>

      {/* NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, Coach <strong>{user.name}</strong></span>
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
                  {user.name.charAt(0)}
                </div>
              </div>
              <h4 className="fw-bold text-navy mb-1">{user.name}</h4>
              <span className="badge bg-primary rounded-pill mb-3" style={{ fontSize: '.75rem', letterSpacing: '1px' }}>
                CERTIFIED COACH
              </span>
              <p className="small text-muted">{user.email}</p>
              <hr />
              <div className="text-start">
                <p className="small mb-2"><strong>Specialization:</strong> {profile.specialization}</p>
                <p className="small mb-2"><strong>Experience:</strong> {profile.experience}</p>
                <p className="small mb-2"><strong>Certifications:</strong> {profile.certifications}</p>
                <p className="small mb-0"><strong>District:</strong> {profile.district}</p>
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
                      <label className="form-label small fw-bold">Experience (Years)</label>
                      <input 
                        type="text" className="form-control"
                        value={updatedProfile.experience}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, experience: e.target.value })}
                        required 
                      />
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
                
                {/* TRAINEE ATLETES */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Trainees / Athletes List</h5>
                  <div className="table-responsive">
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
                        <tr>
                          <td><strong>Mohanbabu S</strong></td>
                          <td>Cricket</td>
                          <td>9.5 / 10</td>
                          <td><span className="badge bg-success rounded-pill">Active Training</span></td>
                        </tr>
                        <tr>
                          <td><strong>Preethi A</strong></td>
                          <td>Kabaddi</td>
                          <td>8.2 / 10</td>
                          <td><span className="badge bg-success rounded-pill">Active Training</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SCHEDULED SESSIONS */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Upcoming Training Sessions</h5>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                      <div>
                        <strong className="d-block">Batting Drill &amp; Stance Adjustment</strong>
                        <span className="small text-muted">Salem Cricket Club Ground &bull; 04:00 PM</span>
                      </div>
                      <span className="badge bg-primary rounded-pill">Tomorrow</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center py-3">
                      <div>
                        <strong className="d-block">Stamina &amp; Cardio Conditioning</strong>
                        <span className="small text-muted">Salem Athletic Stadium Track &bull; 06:00 AM</span>
                      </div>
                      <span className="badge bg-secondary rounded-pill">08 Jul 2026</span>
                    </li>
                  </ul>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
