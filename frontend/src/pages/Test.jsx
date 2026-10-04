import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { startDiagnostic } from '../api/diagnostics';
import { Logo } from '../components/Logo';
import { TestRunner } from '../features/diagnostics/TestRunner';
import '../styles/test.css';

function Intro({ test, onStart }) {
  const maxPoints = test.questions.reduce((sum, question) => sum + question.points, 0);
  return (
    <div className="test-intro">
      <div className="card intro-card">
        <div className="intro-brand">
          <Logo size={30} />
          LearnCurve
        </div>
        <div className="intro-eyebrow">
          {test.subject} · {test.chapter}
        </div>
        <h1>{test.title}</h1>
        <p className="intro-story">{test.intro}</p>
        <ul className="intro-facts">
          <li>
            <strong>{test.questions.length}</strong> questions
          </li>
          <li>
            <strong>{maxPoints}</strong> points up for grabs
          </li>
          <li>
            Hints cost <strong>{test.hintCost}</strong> pts each
          </li>
          <li>
            A ★ <strong>boss question</strong> waits at the end
          </li>
        </ul>
        <div className="intro-actions">
          <button className="btn btn-primary" onClick={onStart}>
            Start mission
          </button>
          <Link className="btn btn-ghost" to="/dashboard">
            Back
          </Link>
        </div>
        <p className="intro-demo" role="note">
          Demo test on sample data — results aren&rsquo;t saved.
        </p>
      </div>
    </div>
  );
}

/** Diagnostic test page: intro screen, then the question-by-question runner and results. */
export default function Test() {
  const [test, setTest] = useState(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    startDiagnostic().then((loaded) => {
      if (!cancelled) setTest(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!test) return <div className="page-loading">Loading…</div>;
  if (!started) return <Intro test={test} onStart={() => setStarted(true)} />;
  return <TestRunner test={test} />;
}
