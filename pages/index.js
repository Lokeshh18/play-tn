import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

// Mock data fallbacks (same as play-tn.html)
const defaultMatches = [
  { id: 1, title: "District Cricket Tournament", location: "Salem", date: "10 Jun 2026", sport: "Cricket", emoji: "🏏" },
  { id: 2, title: "Football League Match", location: "Coimbatore", date: "15 Jun 2026", sport: "Football", emoji: "⚽" },
  { id: 3, title: "Kabaddi Open Match", location: "Tiruppur", date: "18 Jun 2026", sport: "Kabaddi", emoji: "🤾" },
  { id: 4, title: "Badminton District Cup", location: "Chennai", date: "22 Jun 2026", sport: "Badminton", emoji: "🏸" },
  { id: 5, title: "Volleyball State Qualifier", location: "Madurai", date: "28 Jun 2026", sport: "Volleyball", emoji: "🏐" },
  { id: 6, title: "Athletics Open", location: "Erode", date: "05 Jul 2026", sport: "Athletics", emoji: "🏃" },
];

const defaultStatePlayers = [
  { name: "Mohanbabu S", district: "Salem", sport: "Cricket", matches: 24, wins: 21, pts: 420, trend: "up" },
  { name: "Raghav V", district: "Coimbatore", sport: "Football", matches: 22, wins: 19, pts: 398, trend: "up" },
  { name: "Divyesh A", district: "Tiruchirappalli", sport: "Kabaddi", matches: 23, wins: 18, pts: 368, trend: "up" },
  { name: "Lokesh S", district: "Tiruppur", sport: "Handball", matches: 20, wins: 17, pts: 352, trend: "up" },
  { name: "Priya Selvam", district: "Coimbatore", sport: "Badminton", matches: 22, wins: 17, pts: 355, trend: "up" },
  { name: "Sathiyajeeva", district: "Coimbatore", sport: "Athletics", matches: 20, wins: 16, pts: 336, trend: "up" },
  { name: "Anitha R", district: "Erode", sport: "Volleyball", matches: 19, wins: 12, pts: 254, trend: "eq" },
  { name: "Senthil M", district: "Tiruchirappalli", sport: "Football", matches: 17, wins: 11, pts: 238, trend: "up" },
  { name: "Murugan S", district: "Tiruppur", sport: "Cricket", matches: 18, wins: 13, pts: 276, trend: "up" },
  { name: "Meena S", district: "Chennai", sport: "Badminton", matches: 19, wins: 12, pts: 246, trend: "up" },
];

const defaultDistrictData = {
  Salem: [
    { name: "Divya Lakshmi", sport: "Kabaddi", matches: 21, wins: 14, pts: 298, trend: "dn" },
    { name: "Kalam S", sport: "Cricket", matches: 18, wins: 13, pts: 264, trend: "up" },
    { name: "Nithya R", sport: "Badminton", matches: 16, wins: 11, pts: 234, trend: "eq" },
    { name: "Balu M", sport: "Football", matches: 15, wins: 9, pts: 198, trend: "up" },
    { name: "Saranya K", sport: "Volleyball", matches: 13, wins: 7, pts: 155, trend: "dn" },
  ],
  Chennai: [
    { name: "Arjun Kumar", sport: "Cricket", matches: 24, wins: 19, pts: 380, trend: "up" },
    { name: "Rajesh V", sport: "Athletics", matches: 15, wins: 9, pts: 198, trend: "eq" },
    { name: "Meena S", sport: "Badminton", matches: 19, wins: 12, pts: 246, trend: "up" },
    { name: "Suresh K", sport: "Football", matches: 17, wins: 10, pts: 210, trend: "dn" },
    { name: "Preethi A", sport: "Kabaddi", matches: 14, wins: 8, pts: 172, trend: "eq" },
  ],
  Coimbatore: [
    { name: "Priya Selvam", sport: "Badminton", matches: 22, wins: 17, pts: 355, trend: "up" },
    { name: "Deepa N", sport: "Kabaddi", matches: 14, wins: 8, pts: 182, trend: "up" },
    { name: "Hari P", sport: "Cricket", matches: 18, wins: 11, pts: 224, trend: "eq" },
    { name: "Vani R", sport: "Volleyball", matches: 15, wins: 9, pts: 188, trend: "dn" },
    { name: "Rajan T", sport: "Football", matches: 16, wins: 8, pts: 168, trend: "up" },
  ],
  Madurai: [
    { name: "Karthik Raja", sport: "Football", matches: 20, wins: 15, pts: 318, trend: "eq" },
    { name: "Sundar M", sport: "Cricket", matches: 17, wins: 11, pts: 232, trend: "up" },
    { name: "Lalitha B", sport: "Kabaddi", matches: 15, wins: 9, pts: 192, trend: "dn" },
    { name: "Vetri S", sport: "Athletics", matches: 13, wins: 7, pts: 148, trend: "eq" },
    { name: "Pooja K", sport: "Badminton", matches: 12, wins: 6, pts: 132, trend: "up" },
  ],
};

const defaultSportData = {
  Cricket: [
    { name: "Mohanbabu S", district: "Salem", matches: 24, wins: 21, pts: 420, trend: "up" },
    { name: "Murugan S", district: "Tiruppur", matches: 18, wins: 13, pts: 276, trend: "up" },
    { name: "Kalam S", district: "Salem", matches: 18, wins: 13, pts: 264, trend: "up" },
  ],
  Football: [
    { name: "Raghav V", district: "Coimbatore", matches: 22, wins: 19, pts: 398, trend: "up" },
    { name: "Senthil M", district: "Tiruchirappalli", matches: 17, wins: 11, pts: 238, trend: "up" },
  ],
  Kabaddi: [
    { name: "Divyesh A", district: "Tiruchirappalli", matches: 23, wins: 18, pts: 368, trend: "up" },
    { name: "Deepa N", district: "Coimbatore", matches: 14, wins: 8, pts: 182, trend: "up" },
  ],
  Handball: [
    { name: "Lokesh S", district: "Tiruppur", matches: 20, wins: 17, pts: 352, trend: "up" },
  ],
  Volleyball: [
    { name: "Anitha R", district: "Erode", matches: 19, wins: 12, pts: 254, trend: "eq" },
  ],
  Badminton: [
    { name: "Priya Selvam", district: "Coimbatore", matches: 22, wins: 17, pts: 355, trend: "up" },
  ],
  Athletics: [
    { name: "Sathiyajeeva", district: "Coimbatore", matches: 20, wins: 16, pts: 336, trend: "up" },
  ],
};

const sportColors = {
  Cricket: "#e67e22", Football: "#27ae60", Kabaddi: "#8e44ad",
  Handball: "#c0392b", Volleyball: "#e74c3c", Badminton: "#2980b9", Athletics: "#16a085"
};

const sportMeta = {
  Cricket: { emoji: "🏏", color: "#e67e22", bg: "linear-gradient(135deg,#e67e22,#d35400)" },
  Football: { emoji: "⚽", color: "#27ae60", bg: "linear-gradient(135deg,#27ae60,#1e8449)" },
  Kabaddi: { emoji: "🤾", color: "#8e44ad", bg: "linear-gradient(135deg,#8e44ad,#6c3483)" },
  Handball: { emoji: "🤾", color: "#c0392b", bg: "linear-gradient(135deg,#c0392b,#922b21)" },
  Volleyball: { emoji: "🏐", color: "#e74c3c", bg: "linear-gradient(135deg,#e74c3c,#c0392b)" },
  Badminton: { emoji: "🏸", color: "#2980b9", bg: "linear-gradient(135deg,#2980b9,#1a5276)" },
  Athletics: { emoji: "🏃", color: "#16a085", bg: "linear-gradient(135deg,#16a085,#0e6655)" },
};

export default function Home() {
  const [currentUser, setCurrentUser] = useState(null);
  const [matches, setMatches] = useState(defaultMatches);
  const [matchesShown, setMatchesShown] = useState(3);
  const [lbTab, setLbTab] = useState('state'); // 'state', 'district', 'sport'
  const [selectedDistrict, setSelectedDistrict] = useState('Salem');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [quickReg, setQuickReg] = useState({ name: '', phone: '', district: '', sport: '' });

  // Authentication check
  useEffect(() => {
    const session = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Fetch dynamic matches from database if configured
  useEffect(() => {
    async function loadDbData() {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co') {
        const { data } = await supabase.from('tournaments').select('*').limit(10);
        if (data && data.length > 0) {
          // Map database structure to UI structure
          setMatches(data.map(d => ({
            id: d.id,
            title: d.name,
            location: d.district,
            date: new Date(d.tournament_start).toLocaleDateString(),
            sport: d.sport,
            emoji: sportMeta[d.sport]?.emoji || '🏆'
          })));
        }
      }
    }
    loadDbData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setCurrentUser(null);
  };

  const loadMoreMatches = () => {
    setMatchesShown(matches.length);
  };

  const getRankBadge = (index) => {
    if (index === 0) return <span className="rank-badge rank-1">1</span>;
    if (index === 1) return <span className="rank-badge rank-2">2</span>;
    if (index === 2) return <span className="rank-badge rank-3">3</span>;
    return <span className="rank-badge rank-n">{index + 1}</span>;
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <span className="trend-up">▲</span>;
    if (trend === 'dn') return <span className="trend-dn">▼</span>;
    return <span className="trend-eq">—</span>;
  };

  const handleQuickRegisterSubmit = (e) => {
    e.preventDefault();
    alert(`Quick registration successful for ${quickReg.name}! Standard login details will be printed to logs.`);
    setQuickReg({ name: '', phone: '', district: '', sport: '' });
  };

  return (
    <>
      <Head>
        <title>Play TN &mdash; Tamil Nadu Sports Ecosystem</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg sticky-top">
        <div className="container">
          <Link href="/" className="navbar-brand">
            PLAY<span>TN</span>
          </Link>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto gap-1 align-items-center">
              <li className="nav-item"><a className="nav-link" href="#matches">Matches</a></li>
              <li className="nav-item"><a className="nav-link" href="#leaderboard">Leaderboard</a></li>
              <li className="nav-item"><a className="nav-link" href="#about">About</a></li>
              {currentUser ? (
                <>
                  <li className="nav-item">
                    <Link href={`/dashboard/${currentUser.role.toLowerCase()}`} className="nav-link text-white fw-bold">
                      Dashboard ({currentUser.name})
                    </Link>
                  </li>
                  <li className="nav-item ms-2">
                    <button onClick={handleLogout} className="btn btn-outline-warning rounded-pill px-3 py-1">
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item"><Link href="/login" className="nav-link">Sign In</Link></li>
                  <li className="nav-item ms-2">
                    <Link href="/register" className="nav-link nav-cta">Join Now</Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="hero">
        <div className="hero-ring"></div>
        <div className="hero-ring"></div>
        <div className="container position-relative">
          <div className="hero-badge fade-in">Tamil Nadu&rsquo;s Unified Sports Platform</div>
          <h1 className="hero-title fade-in-2">PLAY <span>TN</span></h1>
          <p className="hero-sub fade-in-2">Connecting Athletes, Organizers &amp; Coaches Across All 38 Districts</p>
          <div className="d-flex gap-3 justify-content-center mt-4 fade-in-3">
            <a href="#matches" className="btn btn-warning fw-bold px-4 py-2 rounded-pill">View Matches</a>
            <Link href="/register" className="btn btn-outline-light fw-semibold px-4 py-2 rounded-pill">Register Now</Link>
          </div>
          <div className="hero-stats">
            <div className="hstat"><div className="num">10M+</div><div className="lbl">Athletes</div></div>
            <div className="hstat"><div className="num">38</div><div className="lbl">Districts</div></div>
            <div className="hstat"><div className="num">15+</div><div className="lbl">Sports</div></div>
            <div className="hstat"><div className="num">450K</div><div className="lbl">Target Users</div></div>
          </div>
        </div>
      </section>

      {/* UPCOMING MATCHES */}
      <section id="matches" className="py-5">
        <div className="container">
          <div className="text-center mb-5">
            <span className="sec-tag">Live &amp; Upcoming</span>
            <h2 className="sec-title">Upcoming Matches</h2>
          </div>
          <div className="row g-4" id="matchGrid">
            {matches.slice(0, matchesShown).map((m) => (
              <div className="col-md-4" key={m.id}>
                <div className="card match-card shadow-sm h-100">
                  <div className="card-header">{m.emoji} {m.title}</div>
                  <div className="card-body d-flex flex-column justify-content-between">
                    <p className="match-meta">
                      📍 <strong>{m.location}</strong><br />
                      📅 {m.date}<br />
                      <span className="sport-badge">{m.sport}</span>
                    </p>
                    <Link href={`/tournament/${m.id}`} className="btn-register mt-2 w-100 text-center text-decoration-none">
                      Register Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {matchesShown < matches.length && (
            <div className="text-center mt-4">
              <button 
                className="btn rounded-pill px-4 py-2 fw-semibold" 
                style={{ border: '1.5px solid var(--blue)', color: 'var(--blue)' }} 
                onClick={loadMoreMatches}
              >
                Load More Matches
              </button>
            </div>
          )}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="leaderboard" className="py-5">
        <div className="container">
          <div className="text-center mb-4">
            <span className="sec-tag">Rankings</span>
            <h2 className="sec-title">Leaderboard</h2>
            <p className="text-muted">Live standings across Tamil Nadu&rsquo;s sports ecosystem</p>
          </div>

          {/* Tabs */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div className="lb-tabs">
              <button 
                className={`lb-tab ${lbTab === 'state' ? 'active' : ''}`}
                onClick={() => setLbTab('state')}
              >
                🏆 State
              </button>
              <button 
                className={`lb-tab ${lbTab === 'district' ? 'active' : ''}`}
                onClick={() => setLbTab('district')}
              >
                📍 District
              </button>
              <button 
                className={`lb-tab ${lbTab === 'sport' ? 'active' : ''}`}
                onClick={() => setLbTab('sport')}
              >
                ⚽ Sport-wise
              </button>
            </div>

            <div className="d-flex gap-2 align-items-center">
              {lbTab === 'district' && (
                <select 
                  className="district-select"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="Salem">Salem</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Madurai">Madurai</option>
                </select>
              )}
            </div>
          </div>

          {/* State Standings View */}
          {lbTab === 'state' && (
            <div>
              <div className="state-summary">
                <div className="ss-card"><div className="ss-num">{defaultStatePlayers.length}</div><div className="ss-lbl">Total Players</div></div>
                <div className="ss-card"><div className="ss-num">38</div><div className="ss-lbl">Districts</div></div>
                <div className="ss-card"><div className="ss-num">420</div><div className="ss-lbl">Top Score</div></div>
                <div className="ss-card"><div className="ss-num">7</div><div className="ss-lbl">Sports</div></div>
              </div>
              <div className="lb-table-wrap">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Player</th><th>District</th><th>Sport</th>
                      <th>Matches</th><th>Wins</th><th>Points</th><th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {defaultStatePlayers.map((p, i) => (
                      <tr key={i}>
                        <td>{getRankBadge(i)}</td>
                        <td><strong>{p.name}</strong></td>
                        <td><small className="text-muted">{p.district}</small></td>
                        <td>
                          <span style={{
                            display: 'inline-block', width: '8px', height: '8px',
                            borderRadius: '50%', background: sportColors[p.sport] || '#888',
                            marginRight: '5px'
                          }}></span>
                          {p.sport}
                        </td>
                        <td>{p.matches}</td>
                        <td>{p.wins}</td>
                        <td><span className="pts-pill">{p.pts}</span></td>
                        <td>{getTrendIcon(p.trend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* District View */}
          {lbTab === 'district' && (
            <div className="lb-table-wrap">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th>#</th><th>Player</th><th>Sport</th>
                    <th>Matches</th><th>Wins</th><th>Win%</th><th>Points</th><th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {(defaultDistrictData[selectedDistrict] || []).map((p, i) => {
                    const pct = Math.round((p.wins / p.matches) * 100);
                    return (
                      <tr key={i}>
                        <td>{getRankBadge(i)}</td>
                        <td><strong>{p.name}</strong></td>
                        <td>
                          <span style={{
                            display: 'inline-block', width: '8px', height: '8px',
                            borderRadius: '50%', background: sportColors[p.sport] || '#888',
                            marginRight: '5px'
                          }}></span>
                          {p.sport}
                        </td>
                        <td>{p.matches}</td>
                        <td>{p.wins}</td>
                        <td>{pct}%</td>
                        <td><span className="pts-pill">{p.pts}</span></td>
                        <td>{getTrendIcon(p.trend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Sport View */}
          {lbTab === 'sport' && (
            <div>
              <div className="sport-summary">
                {Object.keys(defaultSportData).map((sport) => {
                  const top = defaultSportData[sport][0] || { name: 'N/A', pts: 0 };
                  const meta = sportMeta[sport] || { emoji: '🏆', bg: '#888' };
                  return (
                    <div className="sport-hero-card" key={sport} style={{ background: meta.bg }}>
                      <span className="sh-emoji">{meta.emoji}</span>
                      <span className="sh-name">{sport}</span>
                      <span className="sh-pts">{top.pts}</span>
                      <div className="sh-leader">🥇 {top.name}</div>
                    </div>
                  );
                })}
              </div>

              <div className="sport-pill-tabs">
                {Object.keys(defaultSportData).map((sport) => (
                  <button 
                    key={sport}
                    className={`sport-pill-btn ${selectedSport === sport ? 'active' : ''}`}
                    data-sport={sport}
                    onClick={() => setSelectedSport(sport)}
                  >
                    {sportMeta[sport]?.emoji} {sport}
                  </button>
                ))}
              </div>

              <div className="lb-table-wrap">
                <table className="lb-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Player</th><th>District</th>
                      <th>Matches</th><th>Wins</th><th>Win%</th><th>Points</th><th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(defaultSportData[selectedSport] || []).map((p, i) => {
                      const pct = Math.round((p.wins / p.matches) * 100);
                      const meta = sportMeta[selectedSport] || { color: '#888' };
                      return (
                        <tr key={i}>
                          <td>{getRankBadge(i)}</td>
                          <td><strong>{p.name}</strong></td>
                          <td><small className="text-muted">{p.district}</small></td>
                          <td>{p.matches}</td>
                          <td>{p.wins}</td>
                          <td><span style={{ color: meta.color, fontWeight: '700' }}>{pct}%</span></td>
                          <td>
                            <span className="pts-pill" style={{ background: `${meta.color}22`, color: meta.color }}>
                              {p.pts}
                            </span>
                          </td>
                          <td>{getTrendIcon(p.trend)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* QUICK REGISTRATION */}
      <section id="register">
        <div className="container py-5">
          <div className="text-center mb-5">
            <span className="sec-tag" style={{ color: 'rgba(255,255,255,.7)' }}>Join the Platform</span>
            <h2 className="sec-title light">Player Quick Registration</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-5">
              <div className="reg-card shadow-lg">
                <form onSubmit={handleQuickRegisterSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter your name" 
                      value={quickReg.name}
                      onChange={(e) => setQuickReg({ ...quickReg, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mobile Number</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="+91 XXXXX XXXXX" 
                      value={quickReg.phone}
                      onChange={(e) => setQuickReg({ ...quickReg, phone: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">District</label>
                    <select 
                      className="form-select" 
                      value={quickReg.district}
                      onChange={(e) => setQuickReg({ ...quickReg, district: e.target.value })}
                      required
                    >
                      <option value="">Select District</option>
                      <option value="Salem">Salem</option>
                      <option value="Chennai">Chennai</option>
                      <option value="Coimbatore">Coimbatore</option>
                      <option value="Madurai">Madurai</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Sport</label>
                    <select 
                      className="form-select" 
                      value={quickReg.sport}
                      onChange={(e) => setQuickReg({ ...quickReg, sport: e.target.value })}
                      required
                    >
                      <option value="">Select Sport</option>
                      <option value="Cricket">Cricket</option>
                      <option value="Football">Football</option>
                      <option value="Kabaddi">Kabaddi</option>
                      <option value="Volleyball">Volleyball</option>
                      <option value="Badminton">Badminton</option>
                    </select>
                  </div>
                  <button className="btn-submit">Submit Registration &rarr;</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about">
        <div className="container">
          <div className="text-center mb-5">
            <span className="sec-tag" style={{ color: 'rgba(255,255,255,.6)' }}>About the Platform</span>
            <h2 className="sec-title light">Why Play TN?</h2>
          </div>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="about-card h-100">
                <div className="about-icon">📍</div>
                <h5>Location-Based Discovery</h5>
                <p>Find events, teams, and venues near you using GPS-powered smart recommendations.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="about-card h-100">
                <div className="about-icon">🏆</div>
                <h5>Tournament Management</h5>
                <p>Organizers can schedule, manage, and track tournaments with live bracket management.</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="about-card h-100">
                <div className="about-icon">📊</div>
                <h5>Data-Driven Insights</h5>
                <p>State and district-level analytics for coaches, players, and sports development bodies.</p>
              </div>
            </div>
          </div>
          <p className="text-center mt-4" style={{ color: 'rgba(255,255,255,.55)', fontSize: '.9rem' }}>
            Built for Play TN &mdash; Tamil Nadu Sports Management Platform
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="brand">PLAY TN</div>
          <p className="mt-1 mb-0">One State. One Platform. Unlimited Potential.</p>
          <p className="mt-1" style={{ fontSize: '.78rem' }}>&copy; 2026 Play TN &mdash; Web Portfolio Project</p>
        </div>
      </footer>
    </>
  );
}
