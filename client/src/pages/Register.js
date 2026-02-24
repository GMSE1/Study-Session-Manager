import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    axios.post('/register', formData)
      .then(res => {
        login(res.data);
        navigate('/dashboard');
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Registration failed.');
      });
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Study Session Manager</h2>
        <h3 style={styles.subtitle}>Create your account</h3>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            style={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button style={styles.button} type="submit">Register</button>
        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', justifyContent: 'center',
    alignItems: 'center', height: '100vh',
    backgroundColor: '#0f172a'
  },
  card: {
    backgroundColor: '#1e293b', padding: '40px',
    borderRadius: '12px', width: '360px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  title: { color: '#60a5fa', textAlign: 'center', marginBottom: '4px' },
  subtitle: { color: '#94a3b8', textAlign: 'center', marginBottom: '24px', fontWeight: 'normal' },
  error: { color: '#f87171', textAlign: 'center', marginBottom: '12px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: {
    padding: '12px', borderRadius: '8px',
    border: '1px solid #334155', backgroundColor: '#0f172a',
    color: '#f1f5f9', fontSize: '14px'
  },
  button: {
    padding: '12px', borderRadius: '8px',
    backgroundColor: '#3b82f6', color: 'white',
    border: 'none', fontSize: '16px',
    cursor: 'pointer', marginTop: '8px'
  },
  link: { color: '#94a3b8', textAlign: 'center', marginTop: '16px', fontSize: '14px' }
};

export default Register;