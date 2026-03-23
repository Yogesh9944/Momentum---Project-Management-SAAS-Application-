import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { format } from 'date-fns';

const PRIORITY_COLOR = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };
const STATUS_COL = { todo: 'badge-gray', in_progress: 'badge-cyan', review: 'badge-violet', done: 'badge-emerald' };

export default function MyTasksPage() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([api.get('/workspaces'), api.get('/tasks/my-tasks')])
      .then(([wsRes, taskRes]) => { setWorkspaces(wsRes.data); setTasks(taskRes.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.priority === filter || t.status === filter);
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date());

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar workspaces={workspaces} activeWorkspace={null} setActiveWorkspace={() => {}} />
      <main className="main-content" style={{ padding: '32px 36px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>My Tasks</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {tasks.length} open tasks{overdue.length > 0 && ` · ${overdue.length} overdue`}
          </p>
        </div>

        {/* FILTER BAR */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All' },
            { value: 'in_progress', label: '◑ In Progress' },
            { value: 'todo', label: '○ To Do' },
            { value: 'review', label: '◐ Review' },
            { value: 'high', label: '⬆ High' },
            { value: 'critical', label: '🔥 Critical' },
          ].map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              className={`btn btn-sm ${filter === f.value ? 'btn-primary' : 'btn-ghost'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ border: '2px dashed var(--ink-4)', borderRadius: 16, padding: 60 }}>
            <span className="empty-icon">✨</span>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--white)' }}>All clear!</h3>
            <p>No tasks matching this filter</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(task => (
              <div key={task._id} className="card" style={{ padding: '14px 18px', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = PRIORITY_COLOR[task.priority]; e.currentTarget.style.transform = 'translateX(3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[task.priority], flexShrink: 0 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                  <span className={`badge ${STATUS_COL[task.status]}`}>{task.status.replace('_', ' ')}</span>
                  {task.project && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', padding: '2px 8px', background: 'var(--ink-3)', borderRadius: 20 }}>{task.project.name}</span>
                  )}
                  {task.dueDate && (
                    <span style={{ fontSize: 12, color: new Date(task.dueDate) < new Date() ? 'var(--rose)' : 'var(--muted)', flexShrink: 0 }}>
                      {new Date(task.dueDate) < new Date() ? '⚠ ' : ''}Due {format(new Date(task.dueDate), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
