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

export default function PlayerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [performance, setPerformance] = useState({ rank: 'N/A', matches: 0, points: 0 });
  
  const [profile, setProfile] = useState({
    age: '',
    dob: '',
    gender: 'Male',
    district: '',
    address: '',
    preferredSport: 'Cricket',
    bio: '',
    achievements: '',
    profilePic: ''
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
    if (userData.role !== 'PLAYER') {
      router.push(`/dashboard/${userData.role.toLowerCase()}`);
      return;
    }

    setUser(userData);
  }, [router]);

  // Load database entries
  useEffect(() => {
    if (!user) return;

    async function loadPlayerData() {
      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const localPic = localStorage.getItem(`player_profile_pic_${user.id}`);

      if (profileData) {
        const mapped = {
          age: profileData.age || '',
          dob: profileData.dob || '',
          gender: profileData.gender || 'Male',
          district: profileData.district || '',
          address: profileData.address || '',
          preferredSport: profileData.preferred_sport || 'Cricket',
          bio: profileData.bio || '',
          achievements: profileData.achievements || '',
          profilePic: profileData.profile_pic || localPic || ''
        };
        setProfile(mapped);
        setUpdatedProfile(mapped);

        // Auto-enable edit mode if player details are uncompleted/empty
        if (!profileData.district || !profileData.age) {
          setEditing(true);
        }
      } else {
        const defaultProfile = {
          age: '',
          dob: '',
          gender: 'Male',
          district: '',
          address: '',
          preferredSport: 'Cricket',
          bio: '',
          achievements: '',
          profilePic: localPic || ''
        };
        setProfile(defaultProfile);
        setUpdatedProfile(defaultProfile);
        // Force edit mode for new users with no profile record at all
        setEditing(true);
      }

      // 2. Fetch Registrations
      const { data: regsData } = await supabase
        .from('tournament_registrations')
        .select('*, tournaments(*)')
        .eq('player_id', user.id);

      if (regsData) {
        setRegistrations(regsData);
      }

      // 3. Fetch Leaderboard Performance metrics
      const { data: perfData } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('player_id', user.id)
        .maybeSingle();

      if (perfData) {
        // Find state rank
        const { count: rankCount } = await supabase
          .from('leaderboards')
          .select('id', { count: 'exact', head: true })
          .gt('points', perfData.points);

        setPerformance({
          rank: `#${(rankCount || 0) + 1}`,
          matches: perfData.matches_played || 0,
          points: perfData.points || 0
        });
      }

      setLoading(false);
    }

    loadPlayerData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    router.push('/login');
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: keep base64/upload sizes small (e.g. < 1.5MB)
    if (file.size > 1500000) {
      showToast("Profile photo must be less than 1.5MB");
      return;
    }

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Supabase storage bucket 'profile-pics'
      const { error: uploadError } = await supabase.storage
        .from('profile-pics')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        // Fall back to base64 if storage bucket is not configured
        console.warn("Storage upload failed, falling back to Base64:", uploadError.message);
        const reader = new FileReader();
        reader.onloadend = () => {
          setUpdatedProfile(prev => ({
            ...prev,
            profilePic: reader.result
          }));
          setProfile(prev => ({
            ...prev,
            profilePic: reader.result
          }));
          localStorage.setItem(`player_profile_pic_${user.id}`, reader.result);
          showToast("Photo loaded locally. Save profile to update!");
        };
        reader.readAsDataURL(file);
      } else {
        // Get public URL
        const { data } = supabase.storage
          .from('profile-pics')
          .getPublicUrl(filePath);

        setUpdatedProfile(prev => ({
          ...prev,
          profilePic: data.publicUrl
        }));
        setProfile(prev => ({
          ...prev,
          profilePic: data.publicUrl
        }));
        localStorage.setItem(`player_profile_pic_${user.id}`, data.publicUrl);
        showToast("Profile photo uploaded successfully!");
      }
    } catch (err) {
      console.error("Photo upload error:", err);
      showToast("Photo upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (updatedProfile.profilePic) {
        localStorage.setItem(`player_profile_pic_${user.id}`, updatedProfile.profilePic);
      }

      const { error } = await supabase
        .from('player_profiles')
        .upsert({
          id: user.id,
          age: parseInt(updatedProfile.age) || null,
          dob: updatedProfile.dob || null,
          gender: updatedProfile.gender,
          district: updatedProfile.district,
          address: updatedProfile.address,
          preferred_sport: updatedProfile.preferredSport,
          bio: updatedProfile.bio,
          achievements: updatedProfile.achievements,
          profile_pic: updatedProfile.profilePic
        });

      if (error) throw error;

      setProfile(updatedProfile);
      setEditing(false);
      showToast("Profile details updated successfully!");
    } catch (err) {
      showToast("Error saving profile details: " + err.message);
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
        <title>Player Dashboard &mdash; Play TN</title>
      </Head>

      {/* DASHBOARD NAV */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <div className="ms-auto d-flex align-items-center gap-3">
            <span className="text-white small d-none d-md-inline">Welcome, <strong>{user?.name}</strong></span>
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

      {/* MAIN CONTENT */}
      <div className="container py-5">
        <div className="row g-4">
          
          {/* PROFILE SUMMARY SIDEBAR */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-white">
              <div className="position-relative d-inline-block mx-auto mb-3" style={{ width: '120px', height: '120px' }}>
                {profile.profilePic ? (
                  <img 
                    src={profile.profilePic} 
                    alt="Profile" 
                    className="rounded-circle w-100 h-100 object-fit-cover shadow"
                    style={{ border: '3px solid var(--blue)' }}
                  />
                ) : (
                  <div className="rounded-circle bg-navy d-flex align-items-center justify-content-center text-white fw-bold fs-1 w-100 h-100">
                    {user?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <h4 className="fw-bold text-navy mb-1">{user?.name}</h4>
              <span className="badge bg-primary rounded-pill mb-3" style={{ fontSize: '.75rem', letterSpacing: '1px' }}>
                ATHLETE / PLAYER
              </span>
              <p className="small text-muted">{user?.email}</p>
              <hr />
              <div className="text-start">
                <p className="small mb-2"><strong>Preferred Sport:</strong> {profile.preferredSport || 'Not set'}</p>
                <p className="small mb-2"><strong>District:</strong> {profile.district || 'Not set'}</p>
                <p className="small mb-0"><strong>Achievements:</strong> {profile.achievements || 'None recorded yet'}</p>
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
                    <div className="col-12 text-center mb-3">
                      <div className="position-relative d-inline-block mx-auto mb-2" style={{ width: '100px', height: '100px' }}>
                        {updatedProfile.profilePic ? (
                          <img 
                            src={updatedProfile.profilePic} 
                            alt="Preview" 
                            className="rounded-circle w-100 h-100 object-fit-cover shadow"
                          />
                        ) : (
                          <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center text-muted w-100 h-100 fs-4">
                            📷
                          </div>
                        )}
                      </div>
                      <div className="col-md-6 mx-auto">
                        <label className="form-label small fw-bold">Upload Profile Photo</label>
                        <input 
                          type="file" 
                          className="form-control form-control-sm"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                        />
                      </div>
                    </div>

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
                        required
                      >
                        <option value="">Select Sport</option>
                        <option>Cricket</option>
                        <option>Football</option>
                        <option>Volleyball</option>
                        <option>Kabaddi</option>
                        <option>Badminton</option>
                        <option>Handball</option>
                        <option>Basketball</option>
                      </select>
                    </div>
                    <div className="col-md-6">
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
                    {registrations.length === 0 ? (
                      <p className="text-muted small m-0 p-3 text-center">You haven&apos;t registered for any tournaments yet.</p>
                    ) : (
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
                          {registrations.map(reg => (
                            <tr key={reg.id}>
                              <td><strong>{reg.tournaments?.name}</strong></td>
                              <td>{reg.tournaments?.sport}</td>
                              <td>{new Date(reg.tournaments?.tournament_start).toLocaleDateString()}</td>
                              <td>
                                <span className={`badge rounded-pill ${
                                  reg.payment_status === 'PAID' || reg.payment_status === 'FREE' ? 'bg-success' : 'bg-warning text-dark'
                                }`}>
                                  {reg.payment_status === 'PAID' || reg.payment_status === 'FREE' ? 'Confirmed' : 'Pending Payment'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* MY PERFORMANCE */}
                <div className="card shadow-sm border-0 rounded-4 p-4 bg-white">
                  <h5 className="fw-bold text-navy mb-3">Performance standings</h5>
                  <div className="row g-3">
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center">
                        <span className="text-muted d-block small mb-1">State Rank</span>
                        <h4 className="fw-bold text-navy m-0">{performance.rank}</h4>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center">
                        <span className="text-muted d-block small mb-1">Matches Played</span>
                        <h4 className="fw-bold text-navy m-0">{performance.matches}</h4>
                      </div>
                    </div>
                    <div className="col-sm-4">
                      <div className="p-3 bg-light rounded-3 text-center">
                        <span className="text-muted d-block small mb-1">Total Points</span>
                        <h4 className="fw-bold text-navy m-0">{performance.points}</h4>
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
