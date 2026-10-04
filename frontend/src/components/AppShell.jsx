import { NavLink } from 'react-router-dom';
import '../styles/dashboard.css';
import { initialsOf } from '../features/dashboard/greeting';
import { Logo } from './Logo';

const ICONS = {
  dashboard: <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" />,
  test: (
    <>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </>
  ),
  curve: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-5 3 3 5-7" />
    </>
  ),
  mentor: (
    <>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </>
  ),
};

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { key: 'test', label: 'Take a test' },
  { key: 'curve', label: 'Learning curve' },
  { key: 'mentor', label: 'AI mentor' },
  { key: 'profile', label: 'Profile' },
];

function NavIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

/** Sidebar + main-content layout for signed-in parent pages. Unbuilt pages show a "Soon" pill. */
export function AppShell({ user, onLogout, children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={26} />
          LearnCurve
        </div>
        <nav className="side-nav" aria-label="Main">
          {NAV_ITEMS.map((item) =>
            item.to ? (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
              >
                <NavIcon name={item.key} />
                {item.label}
              </NavLink>
            ) : (
              <span key={item.key} className="side-link" aria-disabled="true">
                <NavIcon name={item.key} />
                {item.label}
                <span className="soon-pill">Soon</span>
              </span>
            ),
          )}
        </nav>
        <div className="side-foot">
          <div className="avatar" aria-hidden="true">
            {initialsOf(user.full_name)}
          </div>
          <div className="side-foot-text">
            <b>{user.full_name}</b>
            Parent account
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
