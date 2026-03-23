import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { format } from 'date-fns';

const WORKSPACE_ICONS = ['🚀', '⚡', '🎯', '💎', '🌊', '🔥', '🏔️', '🎨'];
const WORKSPACE_COLORS = ['#7B5EA7', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#F43F5E', '#3B82F6'];

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [stats, setStats] = useState(null);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewWs, setShowNewWs] = useState(false);
  const [wsForm, setWsForm] = useState({ name: '', description: '', icon: '🚀', color: '#7B5EA7' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/workspaces'),
      api.get('/tasks/my-tasks')
    ]).then(([wsRes, taskRes]) => {
      setWorkspaces(wsRes.data);
      setMyTasks(taskRes.data);
      if (wsRes.data.length > 0) setActiveWorkspace(wsRes.data[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      api.get(`/workspaces/${activeWorkspace._id}/stats`)
        .then(r => setStats(r.data))
        .catch(() => {});
    }
  }, [activeWorkspace]);

  const createWorkspace = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/workspaces', wsForm);
      setWorkspaces(prev => [...prev, res.data]);
      setActiveWorkspace(res.data);
      setShowNewWs(false);
      setWsForm({ name: '', description: '', icon: '🚀', color: '#7B5EA7' });
      addToast('Workspace created! 🎉', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create workspace', 'error');
    } finally { setCreating(false); }
  };

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const PRIORITY_COLOR = { low: 'var(--low)', medium: 'var(--amber)', high: 'var(--high)', critical: 'var(--critical)' };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar workspaces={workspaces} activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />

      <main className="main-content" style={{ padding: '32px 36px' }}>
        {/* HEADER */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, marginBottom: 4 }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {myTasks.length > 0 ? `You have ${myTasks.length} task${myTasks.length !== 1 ? 's' : ''} assigned to you` : 'All caught up! Great work.'}
          </p>
        </div>

        {/* STATS ROW */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36 }}>
            {[
              { label: 'Total Projects', value: stats.totalProjects, icon: '📁', color: 'var(--violet)', sub: `${stats.activeProjects} active` },
              { label: 'Total Tasks', value: stats.totalTasks, icon: '📋', color: 'var(--cyan)', sub: `${stats.inProgressTasks} in progress` },
              { label: 'Completed', value: stats.completedTasks, icon: '✅', color: 'var(--emerald)', sub: stats.totalTasks > 0 ? `${Math.round((stats.completedTasks/stats.totalTasks)*100)}% done` : '—' },
              { label: 'Overdue', value: stats.overdueTasks, icon: '⚠️', color: 'var(--rose)', sub: 'Needs attention' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ cursor: 'default', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{s.value}</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* WORKSPACES */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>Your Workspaces</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowNewWs(true)}>+ New Workspace</button>
            </div>

            {workspaces.length === 0 ? (
              <div className="empty-state" style={{ border: '2px dashed var(--ink-4)', borderRadius: 16, padding: 60 }}>
                <span className="empty-icon">🚀</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--white)' }}>Create your first workspace</h3>
                <p style={{ color: 'var(--muted)', fontSize: 14 }}>Workspaces are where your team's projects live</p>
                <button className="btn btn-primary" onClick={() => setShowNewWs(true)}>Create workspace →</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {workspaces.map(ws => (
                  <div key={ws._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => { setActiveWorkspace(ws); navigate(`/workspace/${ws._id}`); }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = ws.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: ws.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{ws.icon}</div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <h3 style={{ fontSize: 15, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</h3>
                        <p style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.description || 'No description'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex' }}>
                        {ws.members?.slice(0, 3).map((m, i) => (
                          <div key={i} className="avatar avatar-sm" style={{ marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--ink-2)', zIndex: 3 - i }}>
                            {getInitials(m.user?.name)}
                          </div>
                        ))}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ws.members?.length} member{ws.members?.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MY TASKS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>My Tasks</h2>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{myTasks.length} open</span>
            </div>

            {myTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <p style={{ fontSize: 32, marginBottom: 8 }}>✨</p>
                <p style={{ fontSize: 14 }}>No tasks assigned to you</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTasks.map(task => (
                  <div key={task._id} className="card" style={{ padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-5)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div className="priority-dot" style={{ background: PRIORITY_COLOR[task.priority], marginTop: 5 }} />
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                        <p style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {task.project?.name}
                          {task.dueDate && <> · <span style={{ color: new Date(task.dueDate) < new Date() ? 'var(--rose)' : 'var(--muted)' }}>Due {format(new Date(task.dueDate), 'MMM d')}</span></>}
                        </p>
                      </div>
                      <span className={`badge badge-${task.status === 'in_progress' ? 'cyan' : task.status === 'review' ? 'violet' : 'gray'}`} style={{ fontSize: 9 }}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* NEW WORKSPACE MODAL */}
      {showNewWs && (
        <div className="modal-overlay" onClick={() => setShowNewWs(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Workspace</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowNewWs(false)}>✕</button>
            </div>
            <form onSubmit={createWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Icon & Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {WORKSPACE_ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setWsForm(p => ({ ...p, icon: ic }))}
                      style={{ width: 40, height: 40, borderRadius: 10, border: wsForm.icon === ic ? '2px solid var(--violet)' : '1px solid var(--ink-4)', background: 'var(--ink-3)', fontSize: 20, cursor: 'pointer' }}>{ic}</button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                  {WORKSPACE_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setWsForm(p => ({ ...p, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: wsForm.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" placeholder="e.g. Design Team" value={wsForm.name} onChange={e => setWsForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="input" placeholder="What does this workspace do?" value={wsForm.description} onChange={e => setWsForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={creating} style={{ justifyContent: 'center' }}>
                {creating ? <><span className="spinner" /> Creating...</> : 'Create Workspace →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
