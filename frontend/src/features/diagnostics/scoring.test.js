import { describe, expect, it } from 'vitest';
import { buildResults, joinList, mentorMessage, pointsForAnswer } from './scoring';
import { MAX_POINTS, SAMPLE_TEST } from './sampleTest';

const [q1, , , , , , , q8] = SAMPLE_TEST.questions;

/** Aarav's run from docs/engaging-tests-design.md (selected option index, hints used). */
const AARAV = [
  [0, 0],
  [0, 0],
  [1, 0],
  [0, 1],
  [2, 0],
  [0, 0],
  [1, 0],
  [0, 1],
  [0, 0],
  [1, 0],
];

function answersFor(run) {
  return run.map(([selectedIndex, hintsUsed], index) => {
    const question = SAMPLE_TEST.questions[index];
    const correct = selectedIndex === question.correctIndex;
    return {
      questionId: question.id,
      selectedIndex,
      correct,
      hintsUsed,
      points: pointsForAnswer(question, { correct, hintsUsed }, SAMPLE_TEST),
    };
  });
}

describe('sample test data', () => {
  it('has 10 questions worth 155 points, each with 4 options and 2 hints', () => {
    expect(SAMPLE_TEST.questions).toHaveLength(10);
    expect(MAX_POINTS).toBe(155);
    for (const question of SAMPLE_TEST.questions) {
      expect(question.options).toHaveLength(4);
      expect(question.hints).toHaveLength(2);
      expect(question.options[question.correctIndex].misconception).toBeUndefined();
    }
  });

  it('tags every wrong option that has a misconception with a known id', async () => {
    const { MISCONCEPTIONS } = await import('./sampleTest');
    for (const question of SAMPLE_TEST.questions) {
      for (const option of question.options) {
        if (option.misconception) expect(MISCONCEPTIONS).toHaveProperty(option.misconception);
      }
    }
  });
});

describe('pointsForAnswer', () => {
  it('gives 0 for a wrong answer, even with no hints', () => {
    expect(pointsForAnswer(q1, { correct: false, hintsUsed: 0 }, SAMPLE_TEST)).toBe(0);
  });

  it('gives full points with no hints and deducts the hint cost per hint', () => {
    expect(pointsForAnswer(q8, { correct: true, hintsUsed: 0 }, SAMPLE_TEST)).toBe(20);
    expect(pointsForAnswer(q8, { correct: true, hintsUsed: 1 }, SAMPLE_TEST)).toBe(15);
  });

  it('never drops a correct answer below the minimum', () => {
    expect(pointsForAnswer(q1, { correct: true, hintsUsed: 2 }, SAMPLE_TEST)).toBe(5);
    expect(pointsForAnswer(q8, { correct: true, hintsUsed: 2 }, SAMPLE_TEST)).toBe(10);
  });
});

describe('buildResults (Aarav’s run)', () => {
  const results = buildResults(SAMPLE_TEST, answersFor(AARAV));

  it('totals 95 of 155 points with 7 of 10 correct and 2 hints', () => {
    expect(results.totalPoints).toBe(95);
    expect(results.maxPoints).toBe(155);
    expect(results.correctCount).toBe(7);
    expect(results.hintsUsed).toBe(2);
  });

  it('computes mastery from correctness only — tangent is 1 of 4 = 25%', () => {
    const tangent = results.byTopic.find((entry) => entry.topic === 'Tangent');
    expect(tangent).toMatchObject({ correct: 1, total: 4, mastery: 25 });
    for (const topic of ['Ratio identification', 'Sine', 'Standard values', 'Identities']) {
      expect(results.byTopic.find((entry) => entry.topic === topic).mastery).toBe(100);
    }
  });

  it('keeps mastery independent of hints (same answers, no hints => same mastery)', () => {
    const noHints = buildResults(SAMPLE_TEST, answersFor(AARAV.map(([choice]) => [choice, 0])));
    expect(noHints.byTopic.map((entry) => entry.mastery)).toEqual(
      results.byTopic.map((entry) => entry.mastery),
    );
    expect(noHints.totalPoints).toBeGreaterThan(results.totalPoints);
  });
});

describe('mentorMessage', () => {
  it('names the weak topic, the strengths and a practice action', () => {
    const message = mentorMessage(buildResults(SAMPLE_TEST, answersFor(AARAV)));
    expect(message.summary).toContain('You’re strong on');
    expect(message.summary).toContain('Tangent needs attention: 1 of 4 correct.');
    expect(message.summary).toContain('flipped tangent');
    expect(message.action).toEqual({ label: 'Practice: Tangent', topic: 'Tangent' });
  });

  it('congratulates a perfect run and offers no practice action', () => {
    const perfect = SAMPLE_TEST.questions.map((question) => [question.correctIndex, 0]);
    const message = mentorMessage(buildResults(SAMPLE_TEST, answersFor(perfect)));
    expect(message.summary).toMatch(/strong on every topic/);
    expect(message.action).toBeNull();
  });
});

describe('joinList', () => {
  it('joins naturally', () => {
    expect(joinList([])).toBe('');
    expect(joinList(['a'])).toBe('a');
    expect(joinList(['a', 'b'])).toBe('a and b');
    expect(joinList(['a', 'b', 'c'])).toBe('a, b and c');
  });
});
