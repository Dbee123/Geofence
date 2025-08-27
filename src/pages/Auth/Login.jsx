// src/pages/Auth/Login.jsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = () => {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.card}>
        <h2 className={styles.title}>Welcome Back</h2>
        <p className={styles.subtitle}>Log in to continue</p>

        <input
          name="username"
          onChange={handleChange}
          value={form.username}
          placeholder="Username"
          className={styles.input}
          autoComplete="username"
          required
        />

        <input
          name="password"
          onChange={handleChange}
          value={form.password}
          type="password"
          placeholder="Password"
          className={styles.input}
          autoComplete="current-password"
          required
        />

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? <span className={styles.loader}></span> : 'Login'}
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  );
};

export default Login;
