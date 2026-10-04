import '../styles/app.css';
import { useAuth } from '../features/auth/useAuth';

/** Placeholder until the real dashboard (learning curve, mentor, topics) is built. */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const firstName = user.full_name.split(' ')[0];
  return (
    <div className="placeholder-shell">
      <div className="placeholder-card">
        <h1>Welcome, {firstName}</h1>
        <p>You&rsquo;re signed in as a parent. Your learning-curve dashboard is coming soon.</p>
        <button className="btn btn-ghost" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  );
}
