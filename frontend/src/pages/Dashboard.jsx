import { useState } from 'react';
import { USING_SAMPLE_DATA } from '../api/dashboard';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { useAuth } from '../features/auth/useAuth';
import { LearningCurveChart } from '../features/curve/LearningCurveChart';
import { AddChildForm } from '../features/dashboard/AddChildForm';
import { formatDate, greetingFor, initialsOf } from '../features/dashboard/greeting';
import { useDashboard } from '../features/dashboard/useDashboard';
import { RecentTests } from '../features/diagnostics/RecentTests';
import { TopicStanding } from '../features/diagnostics/TopicStanding';
import { MentorPanel } from '../features/mentor/MentorPanel';

function ChildSwitcher({ options, selectedChild, onSelect }) {
  return (
    <div className="child-switcher">
      <div className="avatar" aria-hidden="true">
        {initialsOf(selectedChild.fullName)[0]}
      </div>
      {options.length > 1 ? (
        <select
          aria-label="Switch child"
          value={selectedChild.id}
          onChange={(event) => onSelect(event.target.value)}
        >
          {options.map((child) => (
            <option key={child.id} value={child.id}>
              {child.fullName.split(' ')[0]} · Class {child.classLevel}
            </option>
          ))}
        </select>
      ) : (
        <span>
          {selectedChild.fullName.split(' ')[0]} · Class {selectedChild.classLevel}
        </span>
      )}
    </div>
  );
}

function NoChildState({ onAdd }) {
  return (
    <div className="card empty-state">
      <h2>Add your child</h2>
      <p>Tell us who&rsquo;s learning, and we&rsquo;ll set up their first weekly diagnostic.</p>
      <AddChildForm onSubmit={onAdd} />
    </div>
  );
}

function NoTestsState({ child }) {
  const firstName = child.fullName.split(' ')[0];
  return (
    <div className="card empty-state">
      <h2>No tests yet for {firstName}</h2>
      <p>
        Take the first 12-question Mathematics diagnostic to start {firstName}&rsquo;s learning
        curve. It takes about 15 minutes.
      </p>
      <button className="btn btn-primary" disabled title="Available soon">
        Start first diagnostic
      </button>
    </div>
  );
}

function DashboardBody({ child, data }) {
  const { summary, curve, mentor, topics, recentTests } = data;
  const deltaTone = summary.masteryChangeThisTerm >= 0 ? 'up' : 'down';
  const deltaSign = summary.masteryChangeThisTerm >= 0 ? '↑' : '↓';
  const firstName = child.fullName.split(' ')[0];

  return (
    <>
      <div className="stat-row">
        <StatCard
          label="Overall mastery"
          value={`${summary.overallMastery}%`}
          caption={`${deltaSign} ${Math.abs(summary.masteryChangeThisTerm)}% this term`}
          tone={deltaTone}
        />
        <StatCard
          label="Tests this month"
          value={summary.testsThisMonth}
          caption={summary.testsOnPace ? 'On pace' : 'Behind pace'}
          tone={summary.testsOnPace ? 'up' : 'down'}
        />
        <StatCard
          label="Last test"
          value={`${summary.lastTest.score}%`}
          caption={`${summary.lastTest.topic} · ${formatDate(summary.lastTest.date)}`}
        />
        <StatCard
          label="Topics to watch"
          value={summary.topicsToWatch.length}
          caption={summary.topicsToWatch.join(', ')}
          tone="down"
        />
      </div>

      <div className="grid-2">
        <section className="card curve-panel" aria-labelledby="curve-heading">
          <div className="curve-panel-top">
            <h3 id="curve-heading">{firstName}&rsquo;s learning curve</h3>
            <span className="subject-badge">{curve.subject}</span>
          </div>
          <p className="curve-caption">
            Weekly diagnostic mastery, last {curve.points.length} weeks
          </p>
          <LearningCurveChart points={curve.points} />
        </section>
        <MentorPanel mentor={mentor} />
      </div>

      <TopicStanding topics={topics} subject={curve.subject} classLevel={child.classLevel} />
      <RecentTests tests={recentTests} />
    </>
  );
}

/** Parent dashboard: learning curve, mentor commentary, topic standing and recent tests. */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { status, childList, selectedChild, selectChild, addChild, dashboard, dashboardStatus } =
    useDashboard(user);
  const [addingChild, setAddingChild] = useState(false);
  const firstName = user.full_name.split(' ')[0];

  async function handleAddChild(details) {
    await addChild(details);
    setAddingChild(false);
  }

  let content;
  if (status === 'loading' || (selectedChild && dashboardStatus !== 'ready')) {
    content = <div className="page-loading">Loading…</div>;
  } else if (status === 'error') {
    content = (
      <div className="card empty-state" role="alert">
        <h2>Something went wrong</h2>
        <p>We couldn&rsquo;t load your dashboard. Please refresh the page.</p>
      </div>
    );
  } else if (!selectedChild) {
    content = <NoChildState onAdd={handleAddChild} />;
  } else if (addingChild) {
    content = (
      <div className="card empty-state">
        <h2>Add another child</h2>
        <p>Add a child to track their learning curve too.</p>
        <AddChildForm onSubmit={handleAddChild} onCancel={() => setAddingChild(false)} />
      </div>
    );
  } else if (!dashboard?.hasData) {
    content = <NoTestsState child={selectedChild} />;
  } else {
    content = <DashboardBody child={selectedChild} data={dashboard} />;
  }

  return (
    <AppShell user={user} onLogout={logout}>
      {USING_SAMPLE_DATA && (
        <div className="sample-banner" role="note">
          Showing sample data — real results appear once diagnostics go live.
        </div>
      )}
      <div className="top-row">
        <div>
          <h1 className="greeting">
            {greetingFor()}, {firstName}
          </h1>
          <p className="greeting-sub">
            {selectedChild
              ? `Here's how ${selectedChild.fullName.split(' ')[0]}'s Mathematics curve looks this week.`
              : "Let's get your child set up."}
          </p>
        </div>
        {selectedChild && (
          <div className="top-actions">
            <ChildSwitcher
              options={childList}
              selectedChild={selectedChild}
              onSelect={selectChild}
            />
            {!addingChild && (
              <button className="btn btn-ghost btn-sm" onClick={() => setAddingChild(true)}>
                + Add child
              </button>
            )}
          </div>
        )}
      </div>
      {content}
    </AppShell>
  );
}
