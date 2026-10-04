import { useEffect, useReducer, useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/Logo';
import { ResultsView } from './ResultsView';
import { feedbackFor, initialState, testReducer } from './testReducer';
import { QuestionVisual, TriangleExplorer } from './visuals';

const LETTERS = ['A', 'B', 'C', 'D'];

function formatClock(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

/** Counts up while `running`; purely informational (time never affects scoring). */
function ElapsedTimer({ running }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return (
    <div className="timer" aria-label="Elapsed time">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2" />
        <path d="M9 2h6" />
      </svg>
      {formatClock(seconds)}
    </div>
  );
}

/** The "mission map": one stop per question showing done / wrong / current / upcoming. */
function MissionMap({ test, state }) {
  return (
    <aside className="palette" aria-label="Mission map">
      <h4>Mission map</h4>
      <p className="palette-sub">
        {test.questions.length} stops · {test.chapter}
      </p>
      <ol className="palette-grid">
        {test.questions.map((question, index) => {
          const answer = state.answers[index];
          let status = 'upcoming';
          if (answer) status = answer.correct ? 'done' : 'missed';
          else if (index === state.index && state.phase !== 'finished') status = 'current';
          const label = {
            done: 'correct',
            missed: 'incorrect',
            current: 'current',
            upcoming: 'not visited',
          }[status];
          return (
            <li
              key={question.id}
              className={`p-cell ${status}`}
              aria-label={`Question ${index + 1}: ${label}`}
            >
              {question.level === 'Boss' ? '★' : index + 1}
            </li>
          );
        })}
      </ol>
      <ul className="palette-legend">
        <li>
          <span className="dot dot-done" />
          Correct
        </li>
        <li>
          <span className="dot dot-missed" />
          Missed
        </li>
        <li>
          <span className="dot dot-current" />
          You are here
        </li>
        <li>
          <span className="dot dot-upcoming" />
          Coming up
        </li>
      </ul>
      <p className="palette-note">★ is the boss question.</p>
    </aside>
  );
}

function QuestionCard({ test, state, dispatch }) {
  const question = test.questions[state.index];
  const answer = state.answers[state.index];
  const checked = state.phase === 'checked';
  const feedback = checked ? feedbackFor(question, answer) : null;
  const isLast = state.index + 1 === test.questions.length;
  const hintsLeft = question.hints.length - state.hintsShown;

  return (
    <div className="question-area">
      <div className="q-label">
        {question.topic.toUpperCase()} · {question.level.toUpperCase()} · {question.points} PTS
      </div>
      <p className="q-story">{question.story}</p>
      <h2 className="q-text">{question.text}</h2>

      <div className="q-visual">
        <QuestionVisual visual={question.visual} />
        {question.explorerOnHint && state.hintsShown >= 1 && <TriangleExplorer />}
      </div>

      <div className="options" role="group" aria-label="Answer options">
        {question.options.map((option, index) => {
          let outcome = '';
          if (checked && index === question.correctIndex) outcome = ' correct';
          else if (checked && index === answer.selectedIndex) outcome = ' wrong';
          return (
            <button
              key={option.text}
              type="button"
              className={`option${state.selected === index ? ' selected' : ''}${outcome}`}
              aria-pressed={state.selected === index}
              disabled={checked}
              onClick={() => dispatch({ type: 'select', index })}
            >
              <span className="option-letter">{LETTERS[index]}</span>
              {option.text}
            </button>
          );
        })}
      </div>

      {state.hintsShown > 0 && (
        <ol className="hint-list" aria-label="Hints">
          {question.hints.slice(0, state.hintsShown).map((hint, index) => (
            <li key={hint}>
              <strong>Hint {index + 1}:</strong> {hint}
            </li>
          ))}
        </ol>
      )}

      {feedback && (
        <div className={`feedback feedback-${feedback.tone}`} role="status">
          <strong>{feedback.title}</strong>
          <p>{feedback.detail}</p>
        </div>
      )}

      <div className="q-footer">
        {!checked ? (
          <button
            type="button"
            className="btn btn-ghost"
            disabled={hintsLeft === 0}
            onClick={() => dispatch({ type: 'hint' })}
          >
            {hintsLeft === 0 ? 'No more hints' : `Need a hint? (−${test.hintCost} pts)`}
          </button>
        ) : (
          <span />
        )}
        {!checked ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={state.selected === null}
            onClick={() => dispatch({ type: 'check', now: Date.now() })}
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => dispatch({ type: 'next', now: Date.now() })}
          >
            {isLast ? 'See results' : 'Next question'}
          </button>
        )}
      </div>
    </div>
  );
}

/** Plays a whole test: question by question, then the results screen. */
export function TestRunner({ test }) {
  const [state, rawDispatch] = useReducer(testReducer, undefined, () => initialState());
  const dispatch = (action) => rawDispatch({ ...action, test });
  const finished = state.phase === 'finished';
  const earned = state.answers.reduce((sum, answer) => sum + answer.points, 0);
  const answeredCount = state.answers.length;

  return (
    <div className="test-shell">
      <header className="test-top">
        <div className="test-brand">
          <Logo size={22} />
          {test.title} — {test.chapter}
        </div>
        <div className="test-meta">
          {finished
            ? 'Mission complete'
            : `Question ${state.index + 1} of ${test.questions.length}`}
        </div>
        <div className="test-top-right">
          <div className="points-pill" aria-label="Points so far">
            ⭐ {earned} pts
          </div>
          <ElapsedTimer key={finished ? 'done' : 'running'} running={!finished} />
          <Link className="btn btn-ghost btn-sm" to="/dashboard">
            Exit
          </Link>
        </div>
      </header>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={test.questions.length}
        aria-valuenow={answeredCount}
      >
        <div
          className="progress-fill"
          style={{ width: `${(answeredCount / test.questions.length) * 100}%` }}
        />
      </div>

      {finished ? (
        <ResultsView
          test={test}
          answers={state.answers}
          onRestart={() => dispatch({ type: 'restart', now: Date.now() })}
        />
      ) : (
        <div className="test-body">
          <QuestionCard test={test} state={state} dispatch={dispatch} />
          <MissionMap test={test} state={state} />
        </div>
      )}
    </div>
  );
}
