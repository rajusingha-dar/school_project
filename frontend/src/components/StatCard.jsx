/** A single headline number with a caption. `tone` is 'up' | 'down' | 'neutral'. */
export function StatCard({ label, value, caption, tone = 'neutral' }) {
  return (
    <div className="card stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-delta ${tone}`}>{caption}</div>
    </div>
  );
}
