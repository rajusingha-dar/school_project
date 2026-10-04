import { Link } from 'react-router-dom';
import { masteryBand } from './mastery';
import { buildResults, mentorMessage } from './scoring';

/** End-of-test screen: points (fun), topic mastery (truth), per-question table, mentor message. */
export function ResultsView({ test, answers, onRestart }) {
  const results = buildResults(test, answers);
  const mentor = mentorMessage(results);
  const percent = Math.round((results.totalPoints / results.maxPoints) * 100);

  return (
    <div className="results">
      <div className="results-hero card">
        <div>
          <div className="results-eyebrow">Mission complete</div>
          <h2>
            {results.correctCount} of {results.questionCount} correct
          </h2>
          <p>
            You used {results.hintsUsed} {results.hintsUsed === 1 ? 'hint' : 'hints'}. Great effort
            — every attempt teaches us where to help next.
          </p>
        </div>
        <div className="results-points" aria-label="Total points">
          <span className="results-points-value">{results.totalPoints}</span>
          <span className="results-points-max">/ {results.maxPoints} pts</span>
          <span className="results-points-pct">{percent}% of points</span>
        </div>
      </div>

      <p className="results-note" role="note">
        Points are just for fun. <strong>Mastery</strong> below is what LearnCurve tracks — it only
        counts right and wrong answers, never speed, hints or points.
      </p>

      <div className="results-grid">
        <section className="card results-card" aria-labelledby="mastery-heading">
          <h3 id="mastery-heading">Mastery by topic</h3>
          <ul className="mastery-list">
            {[...results.byTopic]
              .sort((a, b) => a.mastery - b.mastery)
              .map((entry) => {
                const band = masteryBand(entry.mastery);
                return (
                  <li key={entry.topic}>
                    <div className="mastery-row-top">
                      <span>{entry.topic}</span>
                      <span>
                        {entry.correct} of {entry.total} · {entry.mastery}%
                      </span>
                    </div>
                    <div className="mastery-track">
                      <div
                        className={`mastery-fill mastery-${band.key}`}
                        style={{ width: `${entry.mastery}%` }}
                      />
                    </div>
                    <span className={`tag tag-${band.key}`}>{band.label}</span>
                  </li>
                );
              })}
          </ul>
        </section>

        <section className="card mentor-panel" aria-labelledby="results-mentor-heading">
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
            <span id="results-mentor-heading">AI MENTOR</span>
          </div>
          <p>{mentor.summary}</p>
          {mentor.action && (
            <div className="mentor-action">
              <span>{mentor.action.label}</span>
              <button className="btn btn-amber btn-sm" onClick={onRestart}>
                Try again
              </button>
            </div>
          )}
          <p className="mentor-footnote">
            Demo: written by rules from the structured results above. Nothing is saved.
          </p>
        </section>
      </div>

      <section className="card table-section" aria-labelledby="answers-heading">
        <h3 id="answers-heading">Question by question</h3>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Topic</th>
                <th>Level</th>
                <th>Result</th>
                <th>Hints</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {answers.map((answer, index) => {
                const question = test.questions[index];
                return (
                  <tr key={answer.questionId}>
                    <td>{index + 1}</td>
                    <td>{question.topic}</td>
                    <td>{question.level}</td>
                    <td>
                      <span className={`tag ${answer.correct ? 'tag-strong' : 'tag-weak'}`}>
                        {answer.correct ? 'Correct' : 'Missed'}
                      </span>
                    </td>
                    <td>{answer.hintsUsed}</td>
                    <td>
                      {answer.points} / {question.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="results-actions">
        <Link className="btn btn-primary" to="/dashboard">
          Back to dashboard
        </Link>
        <button className="btn btn-ghost" onClick={onRestart}>
          Play again
        </button>
      </div>
    </div>
  );
}
