import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from '../../components/TextField';
import { ROLE_PARENT, ROLE_SCHOOL_ADMIN } from './roles';
import { useAuth } from './useAuth';

/** Email + password login form with the Parent / Teacher-Admin switch from the mockup. */
export function LoginForm() {
  const { login } = useAuth();
  const [audience, setAudience] = useState(ROLE_PARENT);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      // PublicOnlyRoute redirects to the role's home once the user is set.
    } catch (caught) {
      setError(caught.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1>Welcome back</h1>
      <p className="auth-sub">Log in to see the latest learning curve.</p>

      <div className="role-switch" role="group" aria-label="Account type">
        <button
          type="button"
          aria-pressed={audience === ROLE_PARENT}
          onClick={() => setAudience(ROLE_PARENT)}
        >
          Parent
        </button>
        <button
          type="button"
          aria-pressed={audience === ROLE_SCHOOL_ADMIN}
          onClick={() => setAudience(ROLE_SCHOOL_ADMIN)}
        >
          Teacher / Admin
        </button>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@email.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <TextField
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••••"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </button>

      {audience === ROLE_PARENT ? (
        <p className="switch-account">
          New to LearnCurve? <Link to="/register">Create a parent account</Link>
        </p>
      ) : (
        <p className="switch-account">
          Teacher and admin accounts are created by your school. Contact your school administrator
          for access.
        </p>
      )}
    </form>
  );
}
