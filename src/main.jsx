import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowLeft, Bell, Check, ChevronDown, Clock3, GripVertical, Moon, Plus, Sparkles, Sun, Trash2, X } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'make-list-v1';
const TOPIC_KEY = 'make-list-topic-v1';
const THEME_KEY = 'make-list-theme-v1';
const readTasks = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

function App() {
  const [tasks, setTasks] = useState(readTasks);
  const [topic, setTopic] = useState(() => localStorage.getItem(TOPIC_KEY) || '');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [page, setPage] = useState(tasks.length ? 'list' : 'home');
  const [text, setText] = useState('');
  const [reminder, setReminder] = useState('');
  const [filter, setFilter] = useState('all');
  const [dragging, setDragging] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(TOPIC_KEY, topic); }, [topic]);
  useEffect(() => {
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
  }, [darkMode]);
  useEffect(() => {
    if (page === 'list') inputRef.current?.focus();
  }, [page]);

  const doneCount = useMemo(() => tasks.filter(task => task.done).length, [tasks]);
  const visibleTasks = useMemo(() => tasks.filter(task => filter === 'all' || (filter === 'active' ? !task.done : task.done)), [tasks, filter]);

  function addTask(event) {
    event?.preventDefault();
    const title = text.trim();
    if (!title) { inputRef.current?.focus(); return; }
    let reminderAt = null;
    if (reminder) {
      const date = new Date(reminder);
      reminderAt = date.toISOString();
      if (date > new Date() && 'Notification' in window && Notification.permission === 'granted') {
        const delay = date.getTime() - Date.now();
        window.setTimeout(() => new Notification('A little reminder', { body: title }), Math.min(delay, 2147483647));
      } else if (date > new Date() && 'Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            const delay = date.getTime() - Date.now();
            window.setTimeout(() => new Notification('A little reminder', { body: title }), Math.min(delay, 2147483647));
          }
        });
      }
    }
    setTasks(current => [...current, { id: makeId(), title, done: false, reminder: reminderAt, createdAt: Date.now() }]);
    setText(''); setReminder(''); inputRef.current?.focus();
  }

  function toggleTask(id) { setTasks(current => current.map(task => task.id === id ? { ...task, done: !task.done } : task)); }
  function removeTask(id) { setTasks(current => current.filter(task => task.id !== id)); }
  function reorder(targetId) {
    if (!dragging || dragging === targetId) return;
    setTasks(current => {
      const next = [...current];
      const from = next.findIndex(task => task.id === dragging);
      const to = next.findIndex(task => task.id === targetId);
      const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next;
    });
    setDragging(null);
  }
  function formatReminder(iso) {
    const date = new Date(iso);
    return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
  }

  return (
    <main className={`app-shell ${darkMode ? 'dark-mode' : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={() => setPage(tasks.length ? 'list' : 'home')} aria-label="ListIt home"><span className="brand-mark"><Check size={15} strokeWidth={3} /></span><span>List<span className="brand-light">It</span></span></button>
        <div className="top-note"><span className="status-dot" /> a minimal way to get things done</div>
        <div className="top-actions">{page === 'list' && <button className="quiet-button" onClick={() => { setTasks([]); setFilter('all'); }} disabled={!tasks.length}>Clear all</button>}<button className="theme-toggle" onClick={() => setDarkMode(mode => !mode)} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`} title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}<span>{darkMode ? 'Light' : 'Dark'}</span></button></div>
      </header>

      {page === 'home' ? (
        <section className="home-screen">
          <div className="home-copy"><span className="eyebrow"><Sparkles size={14} /> A little room to think</span><h1>Make space for<br /><span>what matters.</span></h1><p>One list. A clearer mind. Start anywhere.</p></div>
          <button className="make-button" onClick={() => setPage('list')}><span className="make-plus"><Plus size={26} strokeWidth={2.2} /></span><span>MAKE list</span><span className="make-caption">your day, one thing at a time</span></button>
          <div className="home-foot"><span>01 — YOUR OWN LITTLE SPACE</span><span>No account. Saved right here.</span></div>
          <div className="decor-orbit orbit-one" /><div className="decor-orbit orbit-two" />
        </section>
      ) : (
        <section className="list-screen">
          <div className="list-heading">
            <button className="back-button" onClick={() => setPage('home')}><ArrowLeft size={16} /> Home</button>
            <div className="heading-title"><span className="eyebrow">YOUR LIST</span><h1>{topic.trim() || 'Things to do'}<span className="period">.</span></h1><p>{tasks.length ? `${tasks.length - doneCount} still on your mind · ${doneCount} done` : 'Get it out of your head. Make it happen.'}</p></div>
            <span className="count-pill">{String(tasks.length).padStart(2, '0')} <span>things</span></span>
          </div>

          <label className="topic-card"><span>LIST TOPIC <span>(OPTIONAL)</span></span><input value={topic} onChange={event => setTopic(event.target.value)} placeholder="e.g. Weekend plans" aria-label="Optional list topic" maxLength={60} /></label>

          <form className="add-card" onSubmit={addTask}>
            <span className="input-plus"><Plus size={19} /></span>
            <input ref={inputRef} className="task-input" value={text} onChange={event => setText(event.target.value)} placeholder="What’s on your mind?" aria-label="New task" />
            <label className={`reminder-trigger ${reminder ? 'has-reminder' : ''}`} title="Set an optional reminder"><Clock3 size={17} /><span>{reminder ? 'Reminder set' : 'Remind me'}</span><input aria-label="Optional reminder" type="datetime-local" value={reminder} min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} onChange={event => setReminder(event.target.value)} /></label>
            {reminder && <button type="button" className="clear-reminder" aria-label="Remove reminder" onClick={() => setReminder('')}><X size={14} /></button>}
            <button className="add-button" type="submit">Add task <Plus size={16} /></button>
          </form>

          <div className="list-toolbar"><div className="filters" role="tablist" aria-label="Filter tasks">{[['all', 'All'], ['active', 'To do'], ['done', 'Done']].map(([key, label]) => <button key={key} role="tab" aria-selected={filter === key} className={`filter-button ${filter === key ? 'selected' : ''}`} onClick={() => setFilter(key)}>{label}<span>{key === 'all' ? tasks.length : key === 'active' ? tasks.length - doneCount : doneCount}</span></button>)}</div><span className="drag-hint"><GripVertical size={15} /> drag to reorder</span></div>

          <div className="task-list" onDragOver={event => event.preventDefault()}>
            {visibleTasks.length ? visibleTasks.map((task, index) => (
              <article key={task.id} className={`task-row ${task.done ? 'is-done' : ''} ${dragging === task.id ? 'is-dragging' : ''}`} draggable onDragStart={() => setDragging(task.id)} onDragEnd={() => setDragging(null)} onDrop={() => reorder(task.id)}>
                <span className="task-index">{String(index + 1).padStart(2, '0')}</span>
                <button className={`check-button ${task.done ? 'checked' : ''}`} onClick={() => toggleTask(task.id)} aria-label={task.done ? 'Mark task as to do' : 'Mark task complete'}>{task.done && <Check size={15} strokeWidth={3} />}</button>
                <div className="task-content"><span className="task-title">{task.title}</span>{task.reminder && <span className="task-reminder"><Bell size={12} /> {formatReminder(task.reminder)}</span>}</div>
                <span className="drag-handle" aria-label="Drag to reorder"><GripVertical size={18} /></span>
                <button className="delete-button" onClick={() => removeTask(task.id)} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button>
              </article>
            )) : <div className="empty-state"><span className="empty-icon">{filter === 'done' ? '✳' : '＋'}</span><p>{filter === 'done' ? 'Nothing checked off just yet.' : filter === 'active' ? 'You’re all caught up.' : 'A blank page can be a lovely place to start.'}</p>{filter !== 'done' && <button onClick={() => inputRef.current?.focus()}>Add your first task <ChevronDown size={14} /></button>}</div>}
          </div>

          <footer className="list-footer"><span><span className="privacy-dot" /> Saved on this device</span>{tasks.length > 0 && <span>{doneCount === tasks.length ? 'Everything is done. Take a breath.' : 'Small steps still move you forward.'}</span>}</footer>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
