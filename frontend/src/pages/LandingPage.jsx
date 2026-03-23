import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FEATURES = [
  { icon: '⚡', label: 'Real-time collaboration', desc: 'See changes instantly. No refreshing. Multiple users, one board.' },
  { icon: '🎯', label: 'Kanban boards', desc: 'Drag tasks across columns. Visualize your entire workflow at a glance.' },
  { icon: '🏢', label: 'Workspaces & teams', desc: 'Separate spaces for each team. Role-based access — admin, member, viewer.' },
  { icon: '📊', label: 'Progress tracking', desc: 'Visual dashboards with live insights. Know what\'s on track and what\'s not.' },
  { icon: '💬', label: 'Task comments', desc: 'Discuss work right inside tasks. No more context-switching to Slack.' },
  { icon: '✅', label: 'Checklists & subtasks', desc: 'Break down complex work into steps. Track completion as you go.' },
  { icon: '🔔', label: 'Smart notifications', desc: 'Only the updates that matter. Due dates, assignments, mentions.' },
  { icon: '🔍', label: 'Search & filter', desc: 'Find any task in seconds. Filter by priority, assignee, status, or date.' },
];

const STATS = [
  { value: '10k+', label: 'Teams shipped' },
  { value: '2.4M', label: 'Tasks completed' },
  { value: '99.9%', label: 'Uptime' },
  { value: '<50ms', label: 'Sync time' },
];

const KANBAN_DEMO = {
  todo: [
    { id: 1, title: 'Design onboarding flow', priority: 'high', tag: 'Design', avatar: 'AR' },
    { id: 2, title: 'Write API documentation', priority: 'medium', tag: 'Docs', avatar: 'YP' },
  ],
  in_progress: [
    { id: 3, title: 'Implement drag & drop', priority: 'critical', tag: 'Dev', avatar: 'YP' },
    { id: 4, title: 'User auth with JWT', priority: 'high', tag: 'Dev', avatar: 'AR' },
  ],
  review: [
    { id: 5, title: 'Landing page redesign', priority: 'medium', tag: 'Design', avatar: 'MK' },
  ],
  done: [
    { id: 6, title: 'Setup MongoDB Atlas', priority: 'low', tag: 'Infra', avatar: 'YP' },
    { id: 7, title: 'Configure CI/CD pipeline', priority: 'medium', tag: 'Infra', avatar: 'AR' },
  ],
};

const PRIORITY_COLORS = {
  low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626'
};

const LOGOS = ['Figma', 'Notion', 'Slack', 'GitHub', 'Linear', 'Vercel', 'Stripe', 'Supabase', 'Figma', 'Notion', 'Slack', 'GitHub', 'Linear', 'Vercel', 'Stripe', 'Supabase'];

export default function LandingPage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [animatedCard, setAnimatedCard] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(i => (i + 1) % FEATURES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePos({ x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height });
      }
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div className="landing">
      {/* NAV */}
      <nav className="landing-nav">
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-mark">M</span>
            <span className="logo-text">Momentum</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#stats">About</a>
          </div>
          <div className="nav-actions">
            <Link to="/auth?mode=login" className="btn btn-ghost btn-sm">Sign in</Link>
            <Link to="/auth?mode=register" className="btn btn-primary btn-sm">Start free →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-orb hero-orb-1" style={{ transform: `translate(${mousePos.x * 30}px, ${mousePos.y * 20}px)` }} />
        <div className="hero-orb hero-orb-2" style={{ transform: `translate(${-mousePos.x * 20}px, ${-mousePos.y * 25}px)` }} />
        <div className="hero-orb hero-orb-3" style={{ transform: `translate(${mousePos.x * 15}px, ${-mousePos.y * 15}px)` }} />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            <span>Real-time · Collaborative · Open source</span>
          </div>

          <h1 className="hero-title">
            Ship projects<br />
            <em className="hero-serif">faster, together.</em>
          </h1>

          <p className="hero-sub">
            Momentum is the project management tool your team will actually use — Kanban boards, real-time collaboration, role-based workspaces, and task tracking. All in one place.
          </p>

          <div className="hero-cta">
            <Link to="/auth?mode=register" className="btn btn-primary btn-lg hero-cta-main">
              Get started free
              <span className="btn-arrow">→</span>
            </Link>
            <a href="#how-it-works" className="btn btn-ghost btn-lg">
              See how it works
            </a>
          </div>

          <p className="hero-fine">No credit card required · Free forever on solo plan</p>
        </div>

        {/* HERO KANBAN PREVIEW */}
        <div className="hero-preview">
          <div className="preview-bar">
            <div className="preview-dots">
              <span /><span /><span />
            </div>
            <span className="preview-title-bar">momentum / launch-v2</span>
          </div>
          <div className="preview-board">
            {Object.entries(KANBAN_DEMO).map(([col, cards]) => (
              <div key={col} className="preview-col">
                <div className="preview-col-head">
                  <span className={`preview-col-dot dot-${col}`} />
                  <span className="preview-col-label">
                    {col === 'in_progress' ? 'In Progress' : col.charAt(0).toUpperCase() + col.slice(1)}
                  </span>
                  <span className="preview-col-count">{cards.length}</span>
                </div>
                {cards.map((card, i) => (
                  <div
                    key={card.id}
                    className={`preview-card ${animatedCard === card.id ? 'preview-card-lift' : ''}`}
                    onMouseEnter={() => setAnimatedCard(card.id)}
                    onMouseLeave={() => setAnimatedCard(null)}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className="preview-card-title">{card.title}</span>
                    <div className="preview-card-meta">
                      <span className="preview-card-tag">{card.tag}</span>
                      <span className="preview-card-dot" style={{ background: PRIORITY_COLORS[card.priority] }} />
                      <span className="preview-card-avatar">{card.avatar}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee-section">
        <p className="marquee-label">Trusted by teams using</p>
        <div className="marquee-track">
          <div className="marquee-inner">
            {LOGOS.map((logo, i) => (
              <span key={i} className="marquee-item">{logo}</span>
            ))}
          </div>
        </div>
      </div>

      {/* STATS */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((s, i) => (
              <div key={i} className="stat-item">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything your team needs<br />to move faster</h2>
            <p className="section-sub">Built with the tools developers love and the UX designers demand.</p>
          </div>

          <div className="features-layout">
            <div className="features-list">
              {FEATURES.map((f, i) => (
                <button
                  key={i}
                  className={`feature-item ${activeFeature === i ? 'active' : ''}`}
                  onClick={() => setActiveFeature(i)}
                >
                  <span className="feature-icon">{f.icon}</span>
                  <div>
                    <div className="feature-label">{f.label}</div>
                    {activeFeature === i && <div className="feature-desc">{f.desc}</div>}
                  </div>
                  {activeFeature === i && <span className="feature-arrow">→</span>}
                </button>
              ))}
            </div>

            <div className="features-visual">
              <div className="features-visual-inner">
                <div className="fv-header">
                  <span className="fv-icon">{FEATURES[activeFeature].icon}</span>
                  <span className="fv-title">{FEATURES[activeFeature].label}</span>
                </div>
                <p className="fv-desc">{FEATURES[activeFeature].desc}</p>

                {/* Dynamic mock UI for each feature */}
                <div className="fv-mock">
                  {activeFeature === 0 && (
                    <div className="mock-realtime">
                      <div className="mock-user mock-user-1">
                        <span className="mock-cursor">▮</span>
                        <span className="mock-user-label">Yogesh is typing...</span>
                      </div>
                      <div className="mock-task-live">
                        <div className="mock-task-bar" />
                        <div className="mock-task-bar short" />
                      </div>
                      <div className="mock-live-dot">● LIVE</div>
                    </div>
                  )}
                  {activeFeature === 1 && (
                    <div className="mock-kanban">
                      {['Todo', 'Doing', 'Done'].map((col, ci) => (
                        <div key={col} className="mock-col">
                          <div className="mock-col-head">{col}</div>
                          {[...Array(ci === 1 ? 3 : 2)].map((_, ti) => (
                            <div key={ti} className="mock-mini-card" />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {activeFeature === 2 && (
                    <div className="mock-workspace">
                      {['Design ✦', 'Engineering ⚡', 'Marketing 🎯'].map((w, i) => (
                        <div key={i} className={`mock-ws-item ${i === 1 ? 'active' : ''}`}>
                          <span>{w}</span>
                          <span className="mock-ws-role">{['Admin', 'Member', 'Viewer'][i]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeFeature === 3 && (
                    <div className="mock-dashboard">
                      {[
                        { label: 'Completed', pct: 68, color: 'var(--emerald)' },
                        { label: 'In Progress', pct: 22, color: 'var(--violet)' },
                        { label: 'Overdue', pct: 10, color: 'var(--rose)' },
                      ].map((item, i) => (
                        <div key={i} className="mock-stat">
                          <span className="mock-stat-label">{item.label}</span>
                          <div className="mock-stat-bar">
                            <div className="mock-stat-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                          </div>
                          <span className="mock-stat-pct">{item.pct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(activeFeature > 3) && (
                    <div className="mock-generic">
                      <div className="mock-generic-icon">{FEATURES[activeFeature].icon}</div>
                      <div className="mock-generic-text">{FEATURES[activeFeature].desc}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How it works</span>
            <h2 className="section-title">Up and running<br />in 3 steps</h2>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', icon: '🏢', title: 'Create a workspace', desc: 'Set up your team space. Invite members by email. Assign roles — admin, member, or viewer.' },
              { n: '02', icon: '📁', title: 'Add your projects', desc: 'Create projects with priorities, due dates, and color labels. Track progress automatically as tasks are completed.' },
              { n: '03', icon: '🚀', title: 'Build on the Kanban', desc: 'Create tasks, assign teammates, add checklists, comments, and drag them across columns in real-time.' },
            ].map((step, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{step.n}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {i < 2 && <div className="step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TECH STACK */}
      <section className="tech-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Tech Stack</span>
            <h2 className="section-title">Built on solid foundations</h2>
          </div>
          <div className="tech-grid">
            {[
              { name: 'React + Vite', role: 'Frontend', color: '#61DAFB', icon: '⚛' },
              { name: 'Node.js + Express', role: 'Backend', color: '#68A063', icon: '🟢' },
              { name: 'MongoDB Atlas', role: 'Database', color: '#47A248', icon: '🍃' },
              { name: 'Socket.IO', role: 'Real-time', color: '#25C2A0', icon: '⚡' },
              { name: 'JWT Auth', role: 'Security', color: '#F59E0B', icon: '🔐' },
              { name: 'dnd-kit', role: 'Drag & Drop', color: '#7B5EA7', icon: '🖱️' },
            ].map((t, i) => (
              <div key={i} className="tech-card" style={{ '--tc': t.color }}>
                <span className="tech-icon">{t.icon}</span>
                <span className="tech-name">{t.name}</span>
                <span className="tech-role">{t.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-orb" />
        <div className="container">
          <div className="cta-inner">
            <h2 className="cta-title">
              Ready to build<br />
              <em className="hero-serif">momentum?</em>
            </h2>
            <p className="cta-sub">Join thousands of teams who ship faster with Momentum. Start free, no credit card needed.</p>
            <Link to="/auth?mode=register" className="btn btn-primary btn-lg cta-btn">
              Start your workspace →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-inner">
            <div className="logo">
              <span className="logo-mark">M</span>
              <span className="logo-text">Momentum</span>
            </div>
            <p className="footer-tagline">Ship projects faster, together.</p>
            <div className="footer-links">
              <a href="#features">Features</a>
              <Link to="/auth">Sign in</Link>
              <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2025 Momentum · Built with ♥ on MERN + Socket.IO</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
