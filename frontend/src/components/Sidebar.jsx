import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Sidebar({ workspaces = [], activeWorkspace, setActiveWorkspace }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (activeWorkspace?._id) {
      api.get(`/projects/workspace/${activeWorkspace._id}`)
        .then(r => setProjects(r.data))
        .catch(() => setProjects([]));
    }
  }, [activeWorkspace?._id]);

  const isActive = (path) => location.pathname === path;
  const handleLogout = () => { logout(); navigate('/'); };
  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div style={{ padding: '18px 14px 12px', borderBottom: '1px solid var(--ink-4)', flexShrink: 0 }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #7B5EA7, #06B6D4)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: 'white', flexShrink: 0 }}>M</div>
          <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--white)' }}>Momentum</span>
        </Link>
      </div>

      {/* MAIN NAV */}
      <div style={{ padding: '10px 8px 4px' }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-5)', padding: '4px 8px 8px' }}>Main</p>
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <span className="icon">⬡</span> Overview
        </Link>
        <Link to="/my-tasks" className={`nav-item ${isActive('/my-tasks') ? 'active' : ''}`}>
          <span className="icon">✓</span> My Tasks
        </Link>
      </div>

      {/* WORKSPACES */}
      <div style={{ padding: '4px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px 8px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-5)' }}>Workspaces</p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 4px', borderRadius: 4 }}
            title="New workspace">+</button>
        </div>

        {workspaces.map(ws => (
          <div key={ws._id}>
            <button
              className={`nav-item ${activeWorkspace?._id === ws._id ? 'active' : ''}`}
              onClick={() => {
                setActiveWorkspace(ws);
                navigate(`/workspace/${ws._id}`);
                setExpanded(e => ({ ...e, [ws._id]: !e[ws._id] }));
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{ws.icon || '🏢'}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{ws.name}</span>
              <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: expanded[ws._id] ? 'rotate(90deg)' : 'none', flexShrink: 0 }}>▶</span>
            </button>

            {expanded[ws._id] && activeWorkspace?._id === ws._id && (
              <div style={{ marginLeft: 22, borderLeft: '1px solid var(--ink-4)', paddingLeft: 10, marginBottom: 4 }}>
                <Link
                  to={`/workspace/${ws._id}/projects`}
                  style={{ display: 'block', padding: '5px 8px', fontSize: 12, color: location.pathname.includes('projects') ? 'var(--white)' : 'var(--muted)', textDecoration: 'none', borderRadius: 6, transition: 'color 0.15s' }}
                >📁 Projects</Link>
                {projects.slice(0, 6).map(p => (
                  <Link
                    key={p._id}
                    to={`/workspace/${ws._id}/project/${p._id}/board`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px',
                      fontSize: 12, color: location.pathname.includes(p._id) ? 'var(--white)' : 'var(--muted)',
                      textDecoration: 'none', borderRadius: 6, transition: 'color 0.15s'
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color || '#7B5EA7', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {workspaces.length === 0 && (
          <div style={{ padding: '12px 8px', fontSize: 12, color: 'var(--ink-5)', lineHeight: 1.5 }}>
            No workspaces yet.<br />
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--violet-light)', cursor: 'pointer', padding: 0, fontSize: 12, marginTop: 4 }}>Create one →</button>
          </div>
        )}
      </div>

      {/* USER */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--ink-4)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 10 }}>
          <div className="avatar avatar-sm" style={{ background: 'var(--violet-dim)', color: 'var(--violet-light)', flexShrink: 0 }}>
            {getInitials(user?.name)}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-icon"
            title="Sign out"
            style={{ padding: '5px', fontSize: 14, flexShrink: 0, color: 'var(--muted)' }}>⇤</button>
        </div>
      </div>
    </aside>
  );
}
