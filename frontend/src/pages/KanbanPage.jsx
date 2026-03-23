import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { format } from 'date-fns';
import { io } from 'socket.io-client';

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#6B7280', emoji: '○' },
  { id: 'in_progress', label: 'In Progress', color: '#3B82F6', emoji: '◑' },
  { id: 'review', label: 'Review', color: '#8B5CF6', emoji: '◐' },
  { id: 'done', label: 'Done', color: '#10B981', emoji: '●' },
];

const PRIORITY_COLOR = { low: '#6B7280', medium: '#F59E0B', high: '#EF4444', critical: '#DC2626' };
const PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };
const TAG_COLORS = ['#7B5EA7', '#06B6D4', '#F59E0B', '#EF4444', '#10B981'];

function TaskCard({ task, onClick, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: task._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isSortDragging ? 0.4 : 1 };
  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const checkDone = task.checklist?.filter(c => c.completed).length;
  const checkTotal = task.checklist?.length;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="task-card" onClick={(e) => { e.stopPropagation(); onClick(task); }}>
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {task.tags.slice(0, 2).map((t, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '2px 6px', borderRadius: 4, background: TAG_COLORS[i % TAG_COLORS.length] + '22', color: TAG_COLORS[i % TAG_COLORS.length] }}>{t}</span>
          ))}
        </div>
      )}
      <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.5, marginBottom: 10, color: 'var(--white)' }}>{task.title}</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLOR[task.priority] }} />
          {task.dueDate && (
            <span style={{ fontSize: 10, fontWeight: 600, color: isOverdue ? 'var(--rose)' : 'var(--muted)' }}>
              {isOverdue ? '⚠' : '📅'} {format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
          {checkTotal > 0 && (
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>✓ {checkDone}/{checkTotal}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: -4 }}>
          {task.assignees?.slice(0, 2).map((a, i) => (
            <div key={i} className="avatar avatar-sm" style={{ marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--ink-3)', width: 22, height: 22, fontSize: 8 }}>
              {getInitials(a.name)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, onAddTask }) {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: column.color, fontSize: 14 }}>{column.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--white)' }}>{column.label}</span>
          <span style={{ background: 'var(--ink-4)', color: 'var(--muted)', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{tasks.length}</span>
        </div>
        <button onClick={() => onAddTask(column.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.target.style.background = 'var(--ink-3)'; e.target.style.color = 'var(--white)'; }}
          onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = 'var(--muted)'; }}>+</button>
      </div>
      <div className="kanban-cards">
        <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => <TaskCard key={task._id} task={task} onClick={() => {}} />)}
        </SortableContext>
        {tasks.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--ink-5)', fontSize: 12 }}>Drop tasks here</div>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const { workspaceId, projectId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [workspaces, setWorkspaces] = useState([]);
  const [workspace, setWorkspace] = useState(null);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetail, setTaskDetail] = useState(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [addTaskStatus, setAddTaskStatus] = useState('todo');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '', tags: '' });
  const [newComment, setNewComment] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    Promise.all([
      api.get('/workspaces'),
      api.get(`/workspaces/${workspaceId}`),
      api.get(`/projects/${projectId}`),
      api.get(`/tasks/project/${projectId}`)
    ]).then(([allWs, wsRes, projRes, taskRes]) => {
      setWorkspaces(allWs.data);
      setWorkspace(wsRes.data);
      setProject(projRes.data);
      setTasks(taskRes.data);
    }).catch(console.error).finally(() => setLoading(false));

    // Socket.IO
    const socket = io('/', { path: '/socket.io' });
    socket.emit('join:project', projectId);
    socket.on('task:created', task => setTasks(prev => [task, ...prev]));
    socket.on('task:updated', task => setTasks(prev => prev.map(t => t._id === task._id ? task : t)));
    socket.on('task:deleted', id => setTasks(prev => prev.filter(t => t._id !== id)));
    socket.on('task:moved', task => setTasks(prev => prev.map(t => t._id === task._id ? task : t)));
    return () => socket.disconnect();
  }, [projectId]);

  const tasksByStatus = useCallback(() => {
    let filtered = tasks;
    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
    if (filterPriority) filtered = filtered.filter(t => t.priority === filterPriority);
    return COLUMNS.reduce((acc, col) => {
      acc[col.id] = filtered.filter(t => t.status === col.id).sort((a, b) => a.order - b.order);
      return acc;
    }, {});
  }, [tasks, search, filterPriority]);

  const grouped = tasksByStatus();

  const handleDragStart = ({ active }) => {
    setActiveTask(tasks.find(t => t._id === active.id));
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find(t => t._id === active.id);
    if (!task) return;

    const overTask = tasks.find(t => t._id === over.id);
    const newStatus = overTask ? overTask.status : (COLUMNS.find(c => c.id === over.id)?.id || task.status);

    if (task.status === newStatus && task._id === over.id) return;

    setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
    try {
      await api.patch(`/tasks/${task._id}/status`, { status: newStatus });
    } catch { addToast('Failed to move task', 'error'); }
  };

  const openTaskDetail = async (task) => {
    setSelectedTask(task);
    try {
      const res = await api.get(`/tasks/${task._id}`);
      setTaskDetail(res.data);
    } catch { setTaskDetail(task); }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const tags = taskForm.tags ? taskForm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      await api.post('/tasks', {
        ...taskForm, tags, status: addTaskStatus,
        project: projectId, workspace: workspaceId
      });
      setShowAddTask(false);
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '', tags: '' });
      addToast('Task created! ✓', 'success');
    } catch { addToast('Failed to create task', 'error'); }
    finally { setSaving(false); }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !taskDetail) return;
    try {
      const res = await api.post(`/tasks/${taskDetail._id}/comments`, { content: newComment });
      setTaskDetail(p => ({ ...p, comments: [...(p.comments || []), res.data] }));
      setNewComment('');
    } catch { addToast('Failed to add comment', 'error'); }
  };

  const handleToggleCheck = async (taskId, itemId, completed) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/checklist/${itemId}`, { completed });
      setTaskDetail(p => ({ ...p, checklist: res.data.checklist }));
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, checklist: res.data.checklist } : t));
    } catch {}
  };

  const handleAddCheckItem = async () => {
    if (!newCheckItem.trim() || !taskDetail) return;
    try {
      const updatedChecklist = [...(taskDetail.checklist || []), { text: newCheckItem, completed: false }];
      const res = await api.put(`/tasks/${taskDetail._id}`, { checklist: updatedChecklist });
      setTaskDetail(p => ({ ...p, checklist: res.data.checklist }));
      setTasks(prev => prev.map(t => t._id === taskDetail._id ? { ...t, checklist: res.data.checklist } : t));
      setNewCheckItem('');
    } catch {}
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setSelectedTask(null);
      setTaskDetail(null);
      addToast('Task deleted', 'info');
    } catch { addToast('Failed to delete', 'error'); }
  };

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--ink)', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-lg" />
    </div>
  );

  return (
    <div className="app-layout">
      <Sidebar workspaces={workspaces} activeWorkspace={workspace} setActiveWorkspace={setWorkspace} />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* HEADER */}
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--ink-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: project?.color || 'var(--violet)' }} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.01em' }}>{project?.name}</h1>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>{tasks.length} tasks</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input className="input" style={{ width: 200, padding: '7px 12px', fontSize: 13 }} placeholder="🔍 Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="select input" style={{ width: 120, padding: '7px 12px', fontSize: 13 }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => { setAddTaskStatus('todo'); setShowAddTask(true); }}>+ Task</button>
          </div>
        </div>

        {/* KANBAN BOARD */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {COLUMNS.map(col => (
              <div key={col.id}>
                <div className="kanban-column">
                  <div className="kanban-column-header" style={{ borderTop: `3px solid ${col.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: col.color, fontSize: 14 }}>{col.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{col.label}</span>
                      <span style={{ background: 'var(--ink-4)', color: 'var(--muted)', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{grouped[col.id]?.length || 0}</span>
                    </div>
                    <button onClick={() => { setAddTaskStatus(col.id); setShowAddTask(true); }}
                      style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '4px 6px', borderRadius: 6, transition: 'all 0.15s' }}>+</button>
                  </div>
                  <div className="kanban-cards">
                    <SortableContext items={(grouped[col.id] || []).map(t => t._id)} strategy={verticalListSortingStrategy}>
                      {(grouped[col.id] || []).map(task => (
                        <TaskCard key={task._id} task={task} onClick={openTaskDetail} />
                      ))}
                    </SortableContext>
                    {(grouped[col.id] || []).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ink-5)', fontSize: 12 }}>No tasks yet</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} onClick={() => {}} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* ADD TASK MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Task</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowAddTask(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="select input" value={addTaskStatus} onChange={e => setAddTaskStatus(e.target.value)}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="input" placeholder="What needs to be done?" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} required autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="textarea" placeholder="Add more context..." value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="select input" value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input className="input" type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="input" placeholder="Design, Frontend, Bug" value={taskForm.tags} onChange={e => setTaskForm(p => ({ ...p, tags: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? <><span className="spinner" />Creating...</> : 'Create Task →'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TASK DETAIL MODAL */}
      {selectedTask && taskDetail && (
        <div className="modal-overlay" onClick={() => { setSelectedTask(null); setTaskDetail(null); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLOR[taskDetail.priority] }} />
                <h2 className="modal-title" style={{ fontSize: 18 }}>{taskDetail.title}</h2>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTask(taskDetail._id)}>Delete</button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setSelectedTask(null); setTaskDetail(null); }}>✕</button>
              </div>
            </div>

            <div style={{ overflow: 'auto', flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
              {/* MAIN */}
              <div>
                {taskDetail.description && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Description</p>
                    <p style={{ fontSize: 14, color: 'var(--ghost)', lineHeight: 1.7 }}>{taskDetail.description}</p>
                  </div>
                )}

                {/* CHECKLIST */}
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Checklist {taskDetail.checklist?.length > 0 && `(${taskDetail.checklist.filter(c=>c.completed).length}/${taskDetail.checklist.length})`}
                  </p>
                  {taskDetail.checklist?.length > 0 && (
                    <div className="progress-bar" style={{ marginBottom: 10 }}>
                      <div className="progress-fill" style={{ width: `${Math.round((taskDetail.checklist.filter(c=>c.completed).length / taskDetail.checklist.length) * 100)}%` }} />
                    </div>
                  )}
                  {taskDetail.checklist?.map(item => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--ink-4)' }}>
                      <input type="checkbox" checked={item.completed} onChange={e => handleToggleCheck(taskDetail._id, item._id, e.target.checked)}
                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--violet)' }} />
                      <span style={{ fontSize: 13, textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--muted)' : 'var(--white)', flex: 1 }}>{item.text}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input className="input" style={{ flex: 1, padding: '6px 10px', fontSize: 13 }} placeholder="Add checklist item..." value={newCheckItem} onChange={e => setNewCheckItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCheckItem())} />
                    <button className="btn btn-ghost btn-sm" onClick={handleAddCheckItem}>Add</button>
                  </div>
                </div>

                {/* COMMENTS */}
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                    Comments ({taskDetail.comments?.length || 0})
                  </p>
                  {taskDetail.comments?.map(c => (
                    <div key={c._id} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                      <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{getInitials(c.author?.name)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{c.author?.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{format(new Date(c.createdAt), 'MMM d, h:mm a')}</span>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--ghost)', lineHeight: 1.6 }}>{c.content}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <textarea className="textarea" style={{ fontSize: 13, minHeight: 60 }} placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                    <button className="btn btn-primary btn-sm" onClick={handleAddComment} style={{ alignSelf: 'flex-end', flexShrink: 0 }}>Post</button>
                  </div>
                </div>
              </div>

              {/* SIDEBAR META */}
              <div style={{ borderLeft: '1px solid var(--ink-4)', paddingLeft: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</p>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: 'var(--ink-3)', color: 'var(--white)' }}>
                      {COLUMNS.find(c => c.id === taskDetail.status)?.label}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Priority</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLOR[taskDetail.priority] }} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{PRIORITY_LABEL[taskDetail.priority]}</span>
                    </div>
                  </div>
                  {taskDetail.dueDate && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Due Date</p>
                      <span style={{ fontSize: 13, color: new Date(taskDetail.dueDate) < new Date() ? 'var(--rose)' : 'var(--white)' }}>
                        {format(new Date(taskDetail.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {taskDetail.assignees?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Assignees</p>
                      {taskDetail.assignees.map((a, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div className="avatar avatar-sm">{getInitials(a.name)}</div>
                          <span style={{ fontSize: 13 }}>{a.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {taskDetail.tags?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tags</p>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {taskDetail.tags.map((t, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 20, background: TAG_COLORS[i % TAG_COLORS.length] + '22', color: TAG_COLORS[i % TAG_COLORS.length] }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Created by</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar avatar-sm">{getInitials(taskDetail.createdBy?.name)}</div>
                      <span style={{ fontSize: 13 }}>{taskDetail.createdBy?.name}</span>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Created</p>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{format(new Date(taskDetail.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
