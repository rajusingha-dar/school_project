/**
 * Scoring and result analysis for a diagnostic test.
 *
 * Points (for fun) and mastery (what the diagnostic tracks) are computed separately on purpose:
 * mastery uses correctness only, never hints, speed or points.
 */
import { MISCONCEPTIONS } from './sampleTest';

/**
 * Points earned for one answer. Wrong answers earn 0. A correct answer earns its base points
 * minus the hint cost per hint used, but never less than the configured minimum.
 */
export function pointsForAnswer(
  question,
  { correct, hintsUsed },
  { hintCost, minimumCorrectPoints },
) {
  if (!correct) return 0;
  return Math.max(
    question.points - hintCost * hintsUsed,
    Math.min(minimumCorrectPoints, question.points),
  );
}

/** Join items as "a", "a and b", "a, b and c". */
export function joinList(items) {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Summarise a finished attempt.
 *
 * @param {object} test the test definition
 * @param {Array<{questionId: string, selectedIndex: number, correct: boolean, hintsUsed: number, points: number}>} answers
 */
export function buildResults(test, answers) {
  const questionsById = new Map(test.questions.map((question) => [question.id, question]));
  const topics = new Map();
  const misconceptionCounts = new Map();

  for (const answer of answers) {
    const question = questionsById.get(answer.questionId);
    const entry = topics.get(question.topic) ?? {
      topic: question.topic,
      correct: 0,
      total: 0,
      misconceptions: new Map(),
    };
    entry.total += 1;
    if (answer.correct) {
      entry.correct += 1;
    } else {
      const tag = question.options[answer.selectedIndex]?.misconception;
      if (tag) {
        entry.misconceptions.set(tag, (entry.misconceptions.get(tag) ?? 0) + 1);
        misconceptionCounts.set(tag, (misconceptionCounts.get(tag) ?? 0) + 1);
      }
    }
    topics.set(question.topic, entry);
  }

  const byTopic = [...topics.values()].map((entry) => ({
    ...entry,
    mastery: Math.round((entry.correct / entry.total) * 100),
  }));

  return {
    totalPoints: answers.reduce((sum, answer) => sum + answer.points, 0),
    maxPoints: test.questions.reduce((sum, question) => sum + question.points, 0),
    correctCount: answers.filter((answer) => answer.correct).length,
    questionCount: test.questions.length,
    hintsUsed: answers.reduce((sum, answer) => sum + answer.hintsUsed, 0),
    byTopic,
    misconceptionCounts,
  };
}

const STRONG_AT = 75;

/**
 * Plain-language mentor message built ONLY from structured result data (no free-form chat).
 * In the demo this is rule-based; production would hand the same structure to an AI model to
 * phrase, keeping the facts deterministic.
 */
export function mentorMessage(results) {
  const strong = results.byTopic.filter((entry) => entry.mastery >= STRONG_AT);
  const weak = results.byTopic
    .filter((entry) => entry.mastery < STRONG_AT)
    .sort((a, b) => a.mastery - b.mastery || b.total - a.total);

  if (weak.length === 0) {
    return {
      summary: 'Brilliant run — you were strong on every topic. Ready for a harder set next time.',
      action: null,
    };
  }

  const focus = weak[0];
  const parts = [];
  if (strong.length > 0) {
    parts.push(`You’re strong on ${joinList(strong.map((entry) => entry.topic.toLowerCase()))}.`);
  }
  parts.push(`${focus.topic} needs attention: ${focus.correct} of ${focus.total} correct.`);

  const [topTag] = [...focus.misconceptions.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (topTag) {
    const misconception = MISCONCEPTIONS[topTag];
    parts.push(`The slips look like you ${misconception.label}. ${misconception.tip}`);
  }

  return {
    summary: parts.join(' '),
    action: { label: `Practice: ${focus.topic}`, topic: focus.topic },
  };
}
