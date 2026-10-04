import { formatDate } from '../dashboard/greeting';
import { masteryBand } from './mastery';

/** Table of the child's latest diagnostic attempts. */
export function RecentTests({ tests }) {
  return (
    <section className="card table-section" aria-labelledby="recent-heading">
      <h3 id="recent-heading">Recent tests</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Topic focus</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => {
              const band = masteryBand(test.score);
              return (
                <tr key={test.id}>
                  <td>{formatDate(test.date)}</td>
                  <td>{test.subject}</td>
                  <td>{test.topicFocus}</td>
                  <td>{test.score}%</td>
                  <td>
                    <span className={`tag tag-${band.key}`}>{band.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
