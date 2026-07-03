import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", 
  "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", 
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", 
  "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", 
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
];

const gallerySlides = [
  {
    img: "/images/cover_drive.webp",
    tag: "CRICKET",
    title: "State T20 League Championship",
    desc: "Elite club teams clash in Chennai for the final tournament cup."
  },
  {
    img: "/images/bycycle.jpg",
    tag: "FOOTBALL",
    title: "Tamil Nadu Football League Qualifier",
    desc: "Top district squads compete for promotion in the state finals."
  },
  {
    img: "/images/handball.jpg",
    tag: "HANDBALL",
    title: "Salem Handball Invitational Cup",
    desc: "Intense high-school and college tournament leagues showing local talent."
  },
  {
    img: "/images/volleyball.jpeg",
    tag: "VOLLEYBALL",
    title: "Coimbatore District Volleyball Open",
    desc: "Fast-paced rallies in front of packed stadium crowds in Kovai."
  },
  {
    img: "/images/badminton.webp",
    tag: "BADMINTON",
    title: "Madurai Badminton Masters Singles",
    desc: "Regional seeded players showcasing absolute agility and speed."
  }
];


const sportColors = {
  Cricket: "#e67e22", Football: "#27ae60", Kabaddi: "#8e44ad",
  Handball: "#c0392b", Volleyball: "#e74c3c", Badminton: "#2980b9", Athletics: "#16a085", Basketball: "#e67e22"
};

const sportMeta = {
  Cricket: { emoji: "🏏", color: "#e67e22", bg: "linear-gradient(135deg,#e67e22,#d35400)" },
  Football: { emoji: "⚽", color: "#27ae60", bg: "linear-gradient(135deg,#27ae60,#1e8449)" },
  Kabaddi: { emoji: "🤾", color: "#8e44ad", bg: "linear-gradient(135deg,#8e44ad,#6c3483)" },
  Handball: { emoji: "🤾", color: "#c0392b", bg: "linear-gradient(135deg,#c0392b,#922b21)" },
  Volleyball: { emoji: "🏐", color: "#e74c3c", bg: "linear-gradient(135deg,#e74c3c,#c0392b)" },
  Badminton: { emoji: "🏸", color: "#2980b9", bg: "linear-gradient(135deg,#2980b9,#1a5276)" },
  Athletics: { emoji: "🏃", color: "#16a085", bg: "linear-gradient(135deg,#16a085,#0e6655)" },
  Basketball: { emoji: "🏀", color: "#d35400", bg: "linear-gradient(135deg,#e67e22,#d35400)" }
};

export default function Home() {
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [matchesShown, setMatchesShown] = useState(3);
  const [lbTab, setLbTab] = useState('state'); // 'state', 'district', 'sport'
  const [selectedDistrict, setSelectedDistrict] = useState('Salem');
  const [selectedSport, setSelectedSport] = useState('Cricket');
  const [quickReg, setQuickReg] = useState({ name: '', phone: '', district: '', sport: '' });

  // Slideshow States
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % gallerySlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setActiveSlide(prev => (prev + 1) % gallerySlides.length);
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + gallerySlides.length) % gallerySlides.length);


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

  // Fetch live matches and leaderboard from database
  useEffect(() => {
    async function fetchDatabaseData() {
      // 1. Fetch upcoming matches (approved tournaments)
      const { data: tournamentsData, error: tourneyError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'APPROVED')
        .order('tournament_start', { ascending: true });

      if (tournamentsData) {
        setMatches(tournamentsData.map(t => ({
          id: t.id,
          title: t.name,
          location: t.district,
          date: new Date(t.tournament_start).toLocaleDateString(),
          sport: t.sport,
          emoji: sportMeta[t.sport]?.emoji || '🏆'
        })));
      }

      // 2. Fetch leaderboard standings
      const { data: lbData, error: lbError } = await supabase
        .from('leaderboards')
        .select('*, player_profiles(users(name))')
        .order('points', { ascending: false });

      if (lbData) {
        setLeaderboardData(lbData.map(item => ({
          name: item.player_profiles?.users?.name || 'Unknown Athlete',
          district: item.district,
          sport: item.sport,
          matches: item.matches_played,
          wins: item.matches_won,
          pts: item.points,
          trend: item.trend
        })));
      }
    }

    fetchDatabaseData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setCurrentUser(null);
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
    showToast("Please use the unified Register page to create a player account.");
    setQuickReg({ name: '', phone: '', district: '', sport: '' });
  };

  // Leaderboard filters
  const filteredDistrictData = leaderboardData.filter(p => p.district === selectedDistrict);
  const filteredSportData = leaderboardData.filter(p => p.sport === selectedSport);
  const uniqueSports = Array.from(new Set(leaderboardData.map(p => p.sport)));

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
      <section id="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Kohli MCG Six Video Background */}
        <div className="position-absolute top-0 start-0 w-100 h-100 overflow-hidden" style={{ zIndex: 0 }}>
          <video 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-100 h-100"
            style={{ objectFit: 'cover' }}
          >
            <source src="/images/hero_video.mp4" type="video/mp4" />
          </video>
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
            background: 'linear-gradient(to bottom, rgba(10,36,99,0.85) 0%, rgba(10,36,99,0.7) 100%)'
          }}></div>
        </div>

        <div className="hero-ring" style={{ zIndex: 1 }}></div>
        <div className="hero-ring" style={{ zIndex: 1 }}></div>
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="hero-badge fade-in">Tamil Nadu&rsquo;s Unified Sports Platform</div>
          <h1 className="hero-title fade-in-2">PLAY <span>TN</span></h1>
          <p className="hero-sub fade-in-2">Connecting Athletes, Organizers &amp; Coaches Across All 38 Districts</p>
          <div className="d-flex gap-3 justify-content-center mt-4 fade-in-3">
            <a href="#matches" className="btn btn-warning fw-bold px-4 py-2 rounded-pill">View Matches</a>
            {currentUser ? (
              <Link href={`/dashboard/${currentUser.role.toLowerCase()}`} className="btn btn-outline-light fw-semibold px-4 py-2 rounded-pill">
                View Dashboard
              </Link>
            ) : (
              <Link href="/register" className="btn btn-outline-light fw-semibold px-4 py-2 rounded-pill">
                Register Now
              </Link>
            )}
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
          {matches.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No upcoming tournaments or matches found in the database.</p>
            </div>
          ) : (
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
                      <Link href={`/register`} className="btn-register mt-2 w-100 text-center text-decoration-none">
                        Register Now
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  {TAMIL_NADU_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {leaderboardData.length === 0 ? (
            <div className="text-center py-5 border rounded-4 bg-light">
              <p className="text-muted m-0">No athlete rankings recorded in the database yet.</p>
            </div>
          ) : (
            <>
              {/* State Standings View */}
              {lbTab === 'state' && (
                <div>
                  <div className="state-summary">
                    <div className="ss-card"><div className="ss-num">{leaderboardData.length}</div><div className="ss-lbl">Total Players</div></div>
                    <div className="ss-card"><div className="ss-num">{new Set(leaderboardData.map(p=>p.district)).size}</div><div className="ss-lbl">Districts</div></div>
                    <div className="ss-card"><div className="ss-num">{Math.max(...leaderboardData.map(p=>p.pts))}</div><div className="ss-lbl">Top Score</div></div>
                    <div className="ss-card"><div className="ss-num">{new Set(leaderboardData.map(p=>p.sport)).size}</div><div className="ss-lbl">Sports</div></div>
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
                        {leaderboardData.map((p, i) => (
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
                  {filteredDistrictData.length === 0 ? (
                    <p className="text-muted text-center p-5 m-0">No active athletes found in {selectedDistrict}.</p>
                  ) : (
                    <table className="lb-table">
                      <thead>
                        <tr>
                          <th>#</th><th>Player</th><th>Sport</th>
                          <th>Matches</th><th>Wins</th><th>Win%</th><th>Points</th><th>Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDistrictData.map((p, i) => {
                          const pct = p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 0;
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
                  )}
                </div>
              )}

              {/* Sport View */}
              {lbTab === 'sport' && (
                <div>
                  <div className="sport-pill-tabs">
                    {uniqueSports.map((sport) => (
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
                    {filteredSportData.length === 0 ? (
                      <p className="text-muted text-center p-5 m-0">No athletes ranked in {selectedSport}.</p>
                    ) : (
                      <table className="lb-table">
                        <thead>
                          <tr>
                            <th>#</th><th>Player</th><th>District</th>
                            <th>Matches</th><th>Wins</th><th>Win%</th><th>Points</th><th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSportData.map((p, i) => {
                            const pct = p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 0;
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
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      {/* SPORTS GALLERY CAROUSEL */}
      <section id="gallery" className="py-5" style={{ background: 'var(--navy)' }}>
        <div className="container py-4">
          <div className="text-center mb-5 text-white">
            <span className="sec-tag" style={{ color: 'rgba(255,255,255,.6)' }}>Highlights</span>
            <h2 className="sec-title light text-white">Sports Action Gallery</h2>
            <p className="text-white-50">Showcasing state championships and matches across Tamil Nadu</p>
          </div>

          <div className="position-relative overflow-hidden rounded-4 shadow-lg" style={{ height: '400px', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Carousel Slides */}
            {gallerySlides.map((slide, idx) => (
              <div 
                key={idx}
                className="position-absolute w-100 h-100 transition-all"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url(${slide.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: activeSlide === idx ? 1 : 0,
                  visibility: activeSlide === idx ? 'visible' : 'hidden',
                  transition: 'opacity 0.8s ease-in-out',
                  zIndex: activeSlide === idx ? 1 : 0
                }}
              >
                <div className="position-absolute bottom-0 start-0 p-4 p-md-5 text-white">
                  <span className="badge bg-warning text-dark rounded-pill mb-2 px-3 py-2 small fw-bold" style={{ letterSpacing: '1px' }}>
                    {slide.tag}
                  </span>
                  <h3 className="fw-bold fs-2 text-white">{slide.title}</h3>
                  <p className="m-0 text-white-50">{slide.desc}</p>
                </div>
              </div>
            ))}

            {/* Nav Arrows */}
            <button 
              onClick={prevSlide}
              className="position-absolute top-50 start-0 translate-middle-y ms-3 btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ width: '45px', height: '45px', zIndex: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              &larr;
            </button>
            <button 
              onClick={nextSlide}
              className="position-absolute top-50 end-0 translate-middle-y me-3 btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ width: '45px', height: '45px', zIndex: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.4)' }}
            >
              &rarr;
            </button>

            {/* Dots indicators */}
            <div className="position-absolute bottom-0 end-0 m-4 d-flex gap-2" style={{ zIndex: 10 }}>
              {gallerySlides.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className="rounded-circle border-0"
                  style={{
                    width: '10px',
                    height: '10px',
                    background: activeSlide === idx ? 'var(--gold)' : 'rgba(255,255,255,0.4)',
                    transition: 'background 0.3s'
                  }}
                ></button>
              ))}
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

      {/* TOAST MESSAGE */}
      {toast.show && (
        <div className="position-fixed bottom-0 end-0 m-4 p-3 rounded-4 shadow-lg text-white" style={{
          background: 'var(--navy)',
          borderLeft: '5px solid var(--gold)',
          zIndex: 1050,
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          <div className="d-flex align-items-center gap-2">
            <span>ℹ️</span>
            <span className="fw-semibold">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
