import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

// Frontend step 1 login page: collects credentials and starts session.
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, login } = useAuth();
  const [email, setEmail] = useState('admin@biocng.local');
  const [password, setPassword] = useState('Admin@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  const from = location.state?.from?.pathname || '/dashboard';

  if (token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorText('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (error) {
      setErrorText(error.message || 'Unable to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="auth-title">BioCNG SaaS Login</h1>
        <p className="auth-subtitle">Use your account to access operational modules.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label" htmlFor="email">
            Email
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-label" htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {errorText ? <p className="auth-error">{errorText}</p> : null}

          <button className="auth-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

