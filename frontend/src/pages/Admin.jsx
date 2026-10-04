import '../styles/app.css';
import { useAuth } from '../features/auth/useAuth';

/** Placeholder until the class-wide admin overview is built. */
export default function Admin() {
  const { user, logout } = useAuth();
  return (
    <div className="placeholder-shell">
      <div className="placeholder-card">
        <h1>Welcome, {user.full_name}</h1>
        <p>You&rsquo;re signed in as a school admin. The class overview is coming soon.</p>
        <button className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
