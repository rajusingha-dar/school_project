import { masteryBand } from './mastery';

/** One chip per topic: band tag, topic name and mastery percentage. */
export function TopicStanding({ topics, subject, classLevel }) {
  return (
    <section className="topics-section" aria-labelledby="topics-heading">
      <div className="section-head">
        <h3 id="topics-heading">Topic-wise standing</h3>
        <span className="section-meta">
          {subject} · Class {classLevel}
        </span>
      </div>
      <div className="topic-grid">
        {topics.map((topic) => {
          const band = masteryBand(topic.mastery);
          return (
            <div className="topic-chip" key={topic.id}>
              <span className={`tag tag-${band.key}`}>{band.label}</span>
              <h4>{topic.name}</h4>
              <span className="sub">{topic.mastery}% mastery</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
