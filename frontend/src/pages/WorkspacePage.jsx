import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  useEffect(() => {
    Promise.all([
      api.get(`/workspaces/${workspaceId}`),
      api.get('/workspaces'),
      api.get(`/projects/workspace/${workspaceId}`),
      api.get(`/workspaces/${workspaceId}/stats`)
    ]).then(([wsRes, allWsRes, projRes, statsRes]) => {
      setWorkspace(wsRes.data);
      setWorkspaces(allWsRes.data);
      setProjects(projRes.data);
      setStats(statsRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [workspaceId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail, role: inviteRole });
      setWorkspace(res.data);
      setInviteEmail('');
      setShowInvite(false);
      addToast('Member invited! 👋', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to invite', 'error');
    }
  };

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const PRIORITY_LABEL = { low: '⬇ Low', medium: '→ Medium', high: '⬆ High', critical: '🔥 Critical' };
  const PRIORITY_COLOR = { low: 'badge-gray', medium: 'badge-amber', high: 'badge-rose', critical: 'badge-rose' };
  const STATUS_COLOR = { active: 'badge-emerald', on_hold: 'badge-amber', completed: 'badge-gray', archived: 'badge-gray' };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar workspaces={workspaces} activeWorkspace={workspace} setActiveWorkspace={setWorkspace} />
      <main className="main-content" style={{ padding: '32px 36px' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: (workspace?.color || '#7B5EA7') + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{workspace?.icon}</div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>{workspace?.name}</h1>
              <p style={{ color: 'var(--muted)', fontSize: 14 }}>{workspace?.description || 'No description'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}>👤 Invite</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>📁 Projects →</button>
          </div>
        </div>

        {/* STATS */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Projects', value: stats.totalProjects, icon: '📁', color: 'var(--violet)' },
              { label: 'Tasks', value: stats.totalTasks, icon: '📋', color: 'var(--cyan)' },
              { label: 'Completed', value: stats.completedTasks, icon: '✅', color: 'var(--emerald)' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px' }}>
                <span style={{ fontSize: 24 }}>{s.icon}</span>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          {/* PROJECTS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Projects</h2>
              <button className="btn btn-primary btn-sm" onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>+ New Project</button>
            </div>
            {projects.length === 0 ? (
              <div className="empty-state" style={{ border: '2px dashed var(--ink-4)', borderRadius: 16 }}>
                <span className="empty-icon">📁</span>
                <p style={{ fontWeight: 700 }}>No projects yet</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`/workspace/${workspaceId}/projects`)}>Create first project</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {projects.map(p => (
                  <div key={p._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '16px 20px' }}
                    onClick={() => navigate(`/workspace/${workspaceId}/project/${p._id}/board`)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = p.color || 'var(--violet)'; e.currentTarget.style.transform = 'translateX(3px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || 'var(--violet)', flexShrink: 0 }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.name}</h3>
                          <span className={`badge ${STATUS_COLOR[p.status]}`}>{p.status.replace('_', ' ')}</span>
                          <span className={`badge ${PRIORITY_COLOR[p.priority]}`}>{PRIORITY_LABEL[p.priority]}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-bar" style={{ flex: 1 }}>
                            <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>{p.progress || 0}%</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{p.taskCount || 0} tasks</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MEMBERS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Members</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(true)}>+ Invite</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {workspace?.members?.map((m, i) => (
                <div key={i} className="card" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar avatar-sm">{getInitials(m.user?.name)}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user?.name || 'Unknown'}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user?.email}</p>
                  </div>
                  <span className={`badge ${m.role === 'admin' ? 'badge-violet' : m.role === 'viewer' ? 'badge-gray' : 'badge-cyan'}`}>{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* INVITE MODAL */}
      {showInvite && (
        <div className="modal-overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Invite Member</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowInvite(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Email address</label>
                <input className="input" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="select input" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="admin">Admin — full access</option>
                  <option value="member">Member — can edit</option>
                  <option value="viewer">Viewer — read only</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>Send Invite</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
