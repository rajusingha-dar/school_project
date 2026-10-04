import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TextField } from '../../components/TextField';
import { useAuth } from './useAuth';

const MIN_PASSWORD_LENGTH = 8;

/** Parent registration form (name, email, password). */
export function RegisterForm() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError('Please enter a valid email address.');
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      // PublicOnlyRoute redirects to the dashboard once the user is set.
    } catch (caught) {
      setError(caught.message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1>Create your account</h1>
      <p className="auth-sub">Start tracking your child&rsquo;s learning curve.</p>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <TextField
        label="Full name"
        type="text"
        autoComplete="name"
        placeholder="Priya Sharma"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        required
      />
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />

      <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
        {submitting ? 'Creating account…' : 'Create account'}
      </button>

      <p className="switch-account">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
