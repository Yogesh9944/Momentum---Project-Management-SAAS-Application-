import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { format } from 'date-fns';

const PROJECT_COLORS = ['#7B5EA7', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#F43F5E', '#3B82F6'];

export default function ProjectsPage() {
  const { workspaceId } = useParams();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', priority: 'medium', color: '#7B5EA7', dueDate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/workspaces'),
      api.get(`/workspaces/${workspaceId}`),
      api.get(`/projects/workspace/${workspaceId}`)
    ]).then(([allWs, wsRes, projRes]) => {
      setWorkspaces(allWs.data);
      setWorkspace(wsRes.data);
      setProjects(projRes.data);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', priority: 'medium', color: '#7B5EA7', dueDate: '' }); setShowModal(true); };
  const openEdit = (p, e) => { e.stopPropagation(); setEditing(p); setForm({ name: p.name, description: p.description, priority: p.priority, color: p.color, dueDate: p.dueDate ? format(new Date(p.dueDate), 'yyyy-MM-dd') : '' }); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/projects/${editing._id}`, form);
        setProjects(prev => prev.map(p => p._id === editing._id ? { ...res.data, taskCount: p.taskCount, progress: p.progress } : p));
        addToast('Project updated ✓', 'success');
      } else {
        const res = await api.post('/projects', { ...form, workspace: workspaceId });
        setProjects(prev => [{ ...res.data, taskCount: 0, progress: 0 }, ...prev]);
        addToast('Project created! 🎉', 'success');
      }
      setShowModal(false);
    } catch (err) { addToast(err.response?.data?.message || 'Failed', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p._id !== id));
      addToast('Project deleted', 'info');
    } catch { addToast('Failed to delete', 'error'); }
  };

  const PRIORITY_COLOR = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };
  const STATUS_STYLES = {
    active: { bg: 'var(--emerald-dim)', color: 'var(--emerald)' },
    on_hold: { bg: 'var(--amber-dim)', color: 'var(--amber)' },
    completed: { bg: 'var(--ink-3)', color: 'var(--muted)' },
    archived: { bg: 'var(--ink-3)', color: 'var(--muted)' }
  };

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar workspaces={workspaces} activeWorkspace={workspace} setActiveWorkspace={setWorkspace} />
      <main className="main-content" style={{ padding: '32px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>{workspace?.name}</p>
            <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em' }}>Projects</h1>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ New Project</button>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state" style={{ border: '2px dashed var(--ink-4)', borderRadius: 20, padding: 80 }}>
            <span className="empty-icon">📁</span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--white)' }}>No projects yet</h3>
            <p>Projects help you organize tasks around a goal or product</p>
            <button className="btn btn-primary" onClick={openCreate}>Create your first project →</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {projects.map(p => {
              const ss = STATUS_STYLES[p.status] || STATUS_STYLES.active;
              return (
                <div key={p._id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', borderTop: `3px solid ${p.color}` }}
                  onClick={() => navigate(`/workspace/${workspaceId}/project/${p._id}/board`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 60px rgba(0,0,0,0.3)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ flex: 1, overflow: 'hidden', marginRight: 8 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
                      <p style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description || 'No description'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={e => openEdit(p, e)} style={{ opacity: 0.6 }}>✎</button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={e => handleDelete(p._id, e)} style={{ opacity: 0.6 }}>✕</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: ss.bg, color: ss.color }}>{p.status.replace('_', ' ')}</span>
                    <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'var(--ink-3)', color: PRIORITY_COLOR[p.priority] }}>{p.priority}</span>
                    {p.dueDate && <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'var(--ink-3)', color: new Date(p.dueDate) < new Date() ? 'var(--rose)' : 'var(--muted)' }}>Due {format(new Date(p.dueDate), 'MMM d')}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div className="progress-bar" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', minWidth: 34 }}>{p.progress || 0}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>📋 {p.taskCount || 0} tasks · {p.completedTaskCount || 0} done</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{format(new Date(p.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PROJECT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '2px solid transparent', cursor: 'pointer', flexShrink: 0 }} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="input" placeholder="e.g. Mobile App v2" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="textarea" placeholder="What's the goal of this project?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="select input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? <><span className="spinner" /> Saving...</> : editing ? 'Save Changes' : 'Create Project →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
