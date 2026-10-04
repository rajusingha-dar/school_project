import '../styles/auth.css';
import { Logo } from './Logo';

/** Split-screen layout shared by the login and register pages. */
export function AuthLayout({ children }) {
  return (
    <div className="auth-wrap">
      <aside className="auth-side">
        <svg
          className="auth-bg-curve"
          viewBox="0 0 500 800"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M-20 700 C 80 650, 140 600, 200 560 C 280 505, 320 420, 400 360 C 460 315, 480 260, 520 180"
            fill="none"
            stroke="#3E6155"
            strokeWidth="60"
            strokeLinecap="round"
          />
        </svg>
        <div className="auth-brand">
          <Logo />
          LearnCurve
        </div>
        <div className="auth-quote">
          <h2>&ldquo;Every child has a mentor watching their learning curve, all year.&rdquo;</h2>
          <p>Weekly diagnostics · topic-wise breakdowns · AI-guided next steps</p>
        </div>
        <div />
      </aside>
      <main className="auth-form-side">
        <div className="auth-form">{children}</div>
      </main>
    </div>
  );
}
