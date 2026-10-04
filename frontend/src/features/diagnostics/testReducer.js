import { MISCONCEPTIONS } from './sampleTest';
import { pointsForAnswer } from './scoring';

/**
 * State machine for one diagnostic attempt.
 *
 * phase: 'answering' -> 'checked' -> (next question) -> ... -> 'finished'
 */
export function initialState(now = Date.now()) {
  return {
    index: 0,
    phase: 'answering',
    selected: null,
    hintsShown: 0,
    answers: [],
    questionStartedAt: now,
  };
}

export function testReducer(state, action) {
  const { test } = action;
  switch (action.type) {
    case 'select':
      return state.phase === 'answering' ? { ...state, selected: action.index } : state;

    case 'hint': {
      const question = test.questions[state.index];
      if (state.phase !== 'answering' || state.hintsShown >= question.hints.length) return state;
      return { ...state, hintsShown: state.hintsShown + 1 };
    }

    case 'check': {
      if (state.phase !== 'answering' || state.selected === null) return state;
      const question = test.questions[state.index];
      const correct = state.selected === question.correctIndex;
      const answer = {
        questionId: question.id,
        selectedIndex: state.selected,
        correct,
        hintsUsed: state.hintsShown,
        points: pointsForAnswer(question, { correct, hintsUsed: state.hintsShown }, test),
        seconds: Math.max(0, Math.round((action.now - state.questionStartedAt) / 1000)),
      };
      return { ...state, phase: 'checked', answers: [...state.answers, answer] };
    }

    case 'next': {
      if (state.phase !== 'checked') return state;
      if (state.index + 1 >= test.questions.length) return { ...state, phase: 'finished' };
      return {
        ...state,
        index: state.index + 1,
        phase: 'answering',
        selected: null,
        hintsShown: 0,
        questionStartedAt: action.now,
      };
    }

    case 'restart':
      return initialState(action.now);

    default:
      return state;
  }
}

/** Kind feedback text for the answer just checked. */
export function feedbackFor(question, answer) {
  if (answer.correct) {
    return { tone: 'good', title: `Correct! +${answer.points} pts`, detail: question.explanation };
  }
  const tag = question.options[answer.selectedIndex]?.misconception;
  const misconception = tag ? MISCONCEPTIONS[tag] : null;
  return {
    tone: 'bad',
    title: 'Not quite — good try!',
    detail: misconception
      ? `It looks like you ${misconception.label}. ${misconception.tip} ${question.explanation}`
      : question.explanation,
  };
}
