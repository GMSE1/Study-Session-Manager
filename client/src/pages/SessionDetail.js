import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studySession, setStudySession] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState('');

  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeBlock, setActiveBlock] = useState(null);
  const timerRef = useRef(null);

  // Load session and its blocks on mount
  useEffect(() => {
    axios.get(`/study_sessions/${id}`)
      .then(res => {
        setStudySession(res.data);
        setBlocks(res.data.pomodoro_blocks);
      })
      .catch(() => setError('Failed to load session.'));
  }, [id]);

  // Countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (isRunning && timeLeft === 0) {
      handleBlockComplete();
    }
    return () => clearTimeout(timerRef.current);
  }, [isRunning, timeLeft]);

  function startBlock(blockType) {
    const duration = blockType === 'work' ? 25 : 5;

    axios.post(`/study_sessions/${id}/pomodoro_blocks`, { block_type: blockType })
      .then(res => {
        setActiveBlock(res.data);
        setTimeLeft(duration * 60);
        setIsRunning(true);
      })
      .catch(() => setError('Failed to start block.'));
  }

  function handleBlockComplete() {
    setIsRunning(false);

    if (activeBlock) {
      axios.patch(`/pomodoro_blocks/${activeBlock.id}/complete`)
        .then(res => {
          // Update blocks list and refresh session total
          setBlocks(prev => [...prev, { ...activeBlock, completed: true }]);
          setActiveBlock(null);
          setTimeLeft(null);

          // Refresh session to get updated total_minutes
          return axios.get(`/study_sessions/${id}`);
        })
        .then(res => setStudySession(res.data))
        .catch(() => setError('Failed to complete block.'));
    }
  }

  function pauseResume() {
    setIsRunning(prev => !prev);
  }

  function cancelBlock() {
    clearTimeout(timerRef.current);
    setIsRunning(false);
    setActiveBlock(null);
    setTimeLeft(null);
  }

  function markSessionComplete() {
    axios.patch(`/study_sessions/${id}`, { completed: true })
      .then(res => setStudySession(res.data))
      .catch(() => setError('Failed to update session.'));
  }

  function formatTime(seconds) {
    if (seconds === null) return '--:--';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  if (!studySession) return <div style={styles.loading}>Loading...</div>;

  const workBlocks = blocks.filter(b => b.block_type === 'work' && b.completed).length;
  const timerColor = activeBlock?.block_type === 'break' ? '#34d399' : '#60a5fa';

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/dashboard')}>← Back</button>
        <div>
          {!studySession.completed && (
            <button style={styles.completeBtn} onClick={markSessionComplete}>
              Mark Complete
            </button>
          )}
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Session Info */}
      <div style={styles.card}>
        <h2 style={styles.subject}>{studySession.subject}</h2>
        {studySession.goal && <p style={styles.goal}>{studySession.goal}</p>}
        <div style={styles.stats}>
          <span style={styles.stat}>🍅 {workBlocks} pomodoros</span>
          <span style={styles.stat}>⏱ {studySession.total_minutes} mins focused</span>
          <span style={styles.stat}>
            {studySession.completed ? '✅ Completed' : '🔵 In Progress'}
          </span>
        </div>
      </div>

      {/* Timer */}
      <div style={styles.timerCard}>
        <h3 style={styles.timerLabel}>
          {activeBlock
            ? activeBlock.block_type === 'work' ? '🧠 Focus Time' : '☕ Break Time'
            : 'Ready to focus?'}
        </h3>

        <div style={{ ...styles.timerDisplay, color: timerColor }}>
          {formatTime(timeLeft)}
        </div>

        {/* Timer controls */}
        {!activeBlock && !studySession.completed && (
          <div style={styles.btnRow}>
            <button style={styles.workBtn} onClick={() => startBlock('work')}>
              Start Focus (25 min)
            </button>
            <button style={styles.breakBtn} onClick={() => startBlock('break')}>
              Start Break (5 min)
            </button>
          </div>
        )}

        {activeBlock && (
          <div style={styles.btnRow}>
            <button style={styles.pauseBtn} onClick={pauseResume}>
              {isRunning ? 'Pause' : 'Resume'}
            </button>
            <button style={styles.cancelBtn} onClick={cancelBlock}>
              Cancel
            </button>
          </div>
        )}

        {studySession.completed && (
          <p style={styles.completedMsg}>🎉 Session complete! Great work.</p>
        )}
      </div>

      {/* Block history */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Block History</h3>
        {blocks.length === 0 && (
          <p style={styles.empty}>No blocks yet — start your first focus session!</p>
        )}
        {blocks.map((b, i) => (
          <div key={b.id || i} style={styles.blockRow}>
            <span style={b.block_type === 'work' ? styles.workTag : styles.breakTag}>
              {b.block_type === 'work' ? '🧠 Focus' : '☕ Break'}
            </span>
            <span style={styles.blockDuration}>{b.duration_minutes} min</span>
            <span style={styles.blockStatus}>{b.completed ? '✅' : '⏳'}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

const styles = {
  container: { maxWidth: '680px', margin: '0 auto', padding: '24px', backgroundColor: '#0f172a', minHeight: '100vh' },
  loading: { color: '#94a3b8', textAlign: 'center', marginTop: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  backBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#334155', color: '#f1f5f9', border: 'none', cursor: 'pointer' },
  completeBtn: { padding: '8px 16px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer' },
  error: { color: '#f87171', marginBottom: '12px' },
  card: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '24px', marginBottom: '20px' },
  subject: { color: '#f1f5f9', margin: '0 0 8px 0' },
  goal: { color: '#94a3b8', margin: '0 0 16px 0' },
  stats: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  stat: { color: '#64748b', fontSize: '14px' },
  timerCard: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '32px', marginBottom: '20px', textAlign: 'center' },
  timerLabel: { color: '#94a3b8', marginTop: 0, marginBottom: '16px' },
  timerDisplay: { fontSize: '80px', fontWeight: 'bold', letterSpacing: '4px', margin: '0 0 24px 0', fontFamily: 'monospace' },
  btnRow: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' },
  workBtn: { padding: '12px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer' },
  breakBtn: { padding: '12px 24px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer' },
  pauseBtn: { padding: '12px 24px', borderRadius: '8px', backgroundColor: '#f59e0b', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer' },
  cancelBtn: { padding: '12px 24px', borderRadius: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', fontSize: '14px', cursor: 'pointer' },
  completedMsg: { color: '#34d399', fontSize: '18px', margin: 0 },
  cardTitle: { color: '#f1f5f9', marginTop: 0, marginBottom: '16px' },
  empty: { color: '#64748b', textAlign: 'center', padding: '16px 0' },
  blockRow: { display: 'flex', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: '1px solid #334155' },
  workTag: { color: '#60a5fa', fontSize: '14px', width: '90px' },
  breakTag: { color: '#34d399', fontSize: '14px', width: '90px' },
  blockDuration: { color: '#94a3b8', fontSize: '14px' },
  blockStatus: { marginLeft: 'auto' }
};

export default SessionDetail;