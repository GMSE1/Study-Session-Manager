import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [subject, setSubject] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Load all sessions on mount
  useEffect(() => {
    axios.get('/study_sessions')
      .then(res => setSessions(res.data))
      .catch(() => setError('Failed to load sessions.'));
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!subject.trim()) return;

    axios.post('/study_sessions', { subject, goal })
      .then(res => {
        setSessions([...sessions, res.data]);
        setSubject('');
        setGoal('');
      })
      .catch(() => setError('Failed to create session.'));
  }

  function handleDelete(id) {
    axios.delete(`/study_sessions/${id}`)
      .then(() => setSessions(sessions.filter(s => s.id !== id)))
      .catch(() => setError('Failed to delete session.'));
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📚 Study Session Manager</h2>
        <div style={styles.userInfo}>
          <span style={styles.username}>Hi, {user?.username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Create new session form */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>New Study Session</h3>
        <form onSubmit={handleCreate} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="Subject (e.g. Flask Routes)"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Goal (optional)"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
          <button style={styles.button} type="submit">+ Create Session</button>
        </form>
      </div>

      {/* Sessions list */}
      <div style={styles.sessionList}>
        <h3 style={styles.cardTitle}>Your Sessions</h3>
        {sessions.length === 0 && (
          <p style={styles.empty}>No sessions yet. Create one above!</p>
        )}
        {sessions.map(s => (
          <div key={s.id} style={styles.sessionCard}>
            <div style={styles.sessionInfo}>
              <h4 style={styles.sessionSubject}>{s.subject}</h4>
              {s.goal && <p style={styles.sessionGoal}>{s.goal}</p>}
              <p style={styles.sessionMeta}>
                🍅 {s.pomodoro_count} blocks · ⏱ {s.total_minutes} mins
                · {s.completed ? '✅ Completed' : '🔵 In Progress'}
              </p>
            </div>
            <div style={styles.sessionActions}>
              <button
                style={styles.startBtn}
                onClick={() => navigate(`/sessions/${s.id}`)}
              >
                Open
              </button>
              <button
                style={styles.deleteBtn}
                onClick={() => handleDelete(s.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '720px', margin: '0 auto', padding: '24px', backgroundColor: '#0f172a', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { color: '#60a5fa', margin: 0 },
  userInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  username: { color: '#94a3b8', fontSize: '14px' },
  logoutBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', cursor: 'pointer' },
  error: { color: '#f87171', marginBottom: '12px' },
  card: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  cardTitle: { color: '#f1f5f9', marginTop: 0, marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f1f5f9', fontSize: '14px' },
  button: { padding: '12px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer' },
  sessionList: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px' },
  empty: { color: '#64748b', textAlign: 'center', padding: '24px 0' },
  sessionCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '8px', backgroundColor: '#0f172a', marginBottom: '12px' },
  sessionInfo: { flex: 1 },
  sessionSubject: { color: '#f1f5f9', margin: '0 0 4px 0' },
  sessionGoal: { color: '#94a3b8', fontSize: '13px', margin: '0 0 6px 0' },
  sessionMeta: { color: '#64748b', fontSize: '12px', margin: 0 },
  sessionActions: { display: 'flex', gap: '8px' },
  startBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' },
  deleteBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }
};

export default Dashboard;