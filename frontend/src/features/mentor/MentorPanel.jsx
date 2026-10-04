/** AI mentor commentary plus one recommended next action. */
export function MentorPanel({ mentor }) {
  return (
    <section className="card mentor-panel" aria-labelledby="mentor-heading">
      <div className="mentor-head">
        <div className="mentor-badge" aria-hidden="true">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#142722"
            strokeWidth="2.2"
          >
            <rect x="4" y="9" width="16" height="10" rx="2" />
            <path d="M9 9V6a3 3 0 016 0v3" />
            <circle cx="9" cy="14" r="1" />
            <circle cx="15" cy="14" r="1" />
          </svg>
        </div>
        <span id="mentor-heading">AI MENTOR</span>
      </div>
      <p>{mentor.summary}</p>
      <div className="mentor-action">
        <span>{mentor.recommendedAction.label}</span>
        {/* The test flow arrives in a later step; keep the button visible but inert. */}
        <button className="btn btn-amber btn-sm" disabled title="Available soon">
          Start
        </button>
      </div>
    </section>
  );
}
