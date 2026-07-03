import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PlayerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Player state details
  const [profile, setProfile] = useState({
    age: '24',
    dob: '2002-04-12',
    gender: 'Male',
    district: 'Salem',
    address: '12 Main Street, Salem, TN',
    preferredSport: 'Cricket',
    experience: 'Intermediate',
    bio: 'Cricket enthusiast, right-handed batsman.',
    achievements: 'Winner of Salem District League 2025'
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
    if (userData.role !== 'PLAYER') {
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
    alert("Profile details updated successfully!");
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
        <title>Player Dashboard &mdash; Play TN</title>
      </Head>

      {/* DASHBOARD NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, <strong>{user.name}</strong></span>
            <button onClick={handleLogout} className="btn btn-outline-warning rounded-pill btn-sm px-3">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="container py-5">
        <div className="row g-4">
          
          {/* PROFILE SUMMARY SIDEBAR */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <div className="position-relative d-inline-block mx-auto mb-3" style={{ width: '120px', height: '120px' }}>
                <div className="rounded-circle bg-navy d-flex align-items-center justify-content-center text-white fw-bold fs-1 w-100 h-100">
                  {user.name.charAt(0)}
                </div>
              </div>
              <h4 className="fw-bold text-navy mb-1">{user.name}</h4>
              <span className="badge bg-primary rounded-pill mb-3" style={{ fontSize: '.75rem', letterSpacing: '1px' }}>
                ATHLETE / PLAYER
              </span>
              <p className="small text-muted">{user.email}</p>
              <hr />
              <div className="text-start">
                <p className="small mb-2"><strong>Preferred Sport:</strong> {profile.preferredSport}</p>
                <p className="small mb-2"><strong>District:</strong> {profile.district}</p>
                <p className="small mb-2"><strong>Experience:</strong> {profile.experience}</p>
                <p className="small mb-0"><strong>Achievements:</strong> {profile.achievements || 'None yet'}</p>
              </div>
              <button 
                onClick={() => { setEditing(!editing); setUpdatedProfile({ ...profile }); }}
                className="btn btn-outline-primary rounded-pill w-100 mt-4 btn-sm fw-bold"
              >
                {editing ? 'Cancel Editing' : 'Edit Profile Details'}
              </button>
            </div>
          </div>

          {/* DYNAMIC CARD VIEW */}
          <div className="col-lg-8">
            {editing ? (
              <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5 bg-white">
                <h5 className="fw-bold text-navy mb-4">Edit Profile Information</h5>
                <form onSubmit={handleSaveProfile}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Age</label>
                      <input 
                        type="number" 
                        className="form-control"
                        value={updatedProfile.age}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, age: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Gender</label>
                      <select 
                        className="form-select"
                        value={updatedProfile.gender}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, gender: e.target.value })}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">Preferred Sport</label>
                      <select 
                        className="form-select"
                        value={updatedProfile.preferredSport}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, preferredSport: e.target.value })}
                      >
                        <option>Cricket</option>
                        <option>Football</option>
                        <option>Volleyball</option>
                        <option>Kabaddi</option>
                        <option>Badminton</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold">District</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={updatedProfile.district}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, district: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Bio</label>
                      <textarea 
                        className="form-control" 
                        rows="3"
                        value={updatedProfile.bio}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, bio: e.target.value })}
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold">Achievements</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={updatedProfile.achievements}
                        onChange={(e) => setUpdatedProfile({ ...updatedProfile, achievements: e.target.value })}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-submit mt-4 rounded-pill py-2">Save Profile Updates</button>
                </form>
              </div>
            ) : (
              <div className="d-flex flex-column gap-4">
                
                {/* MY REGISTRATIONS */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Registered Tournaments</h5>
                  <div className="table-responsive">
                    <table className="table align-middle">
                      <thead>
                        <tr>
                          <th>Tournament</th>
                          <th>Sport</th>
                          <th>Schedule Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>District Cricket Cup</strong></td>
                          <td>Cricket</td>
                          <td>10 Jun 2026</td>
                          <td><span className="badge bg-success rounded-pill">Active / Confirmed</span></td>
                        </tr>
                        <tr>
                          <td><strong>State Kabaddi Open</strong></td>
                          <td>Kabaddi</td>
                          <td>18 Jun 2026</td>
                          <td><span className="badge bg-warning rounded-pill">Pending Approval</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MY PERFORMANCE */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Athletic Performance Standings</h5>
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center">
                        <span className="text-muted d-block small mb-1">State Rank</span>
                        <h4 className="fw-bold text-navy m-0">#42</h4>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center">
                        <span className="text-muted d-block small mb-1">Matches Played</span>
                        <h4 className="fw-bold text-navy m-0">15</h4>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center">
                        <span className="text-muted d-block small mb-1">Total Points</span>
                        <h4 className="fw-bold text-navy m-0">310</h4>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
