/**
 * SAMPLE DATA — placeholder until the diagnostic/mastery backend exists (Steps 4-6).
 *
 * Only api/dashboard.js reads this file. The shapes below are what the real endpoints should
 * return (camelCase here; the API client will map from the backend's snake_case), so swapping
 * to real data should not require touching any component.
 */

export const SAMPLE_CHILD_ID = 'sample-aarav';

const aarav = {
  id: SAMPLE_CHILD_ID,
  fullName: 'Aarav Sharma',
  classLevel: 7,
  board: 'CBSE',
};

const aaravDashboard = {
  hasData: true,
  summary: {
    overallMastery: 74,
    masteryChangeThisTerm: 18, // percentage points
    testsThisMonth: 4,
    testsOnPace: true,
    lastTest: { date: '2026-09-08', topic: 'Fractions', score: 44 },
    topicsToWatch: ['Fractions', 'Geometry — angles'],
  },
  curve: {
    subject: 'Mathematics',
    points: [
      { week: 1, mastery: 38 },
      { week: 2, mastery: 41 },
      { week: 3, mastery: 37 },
      { week: 4, mastery: 46 },
      { week: 5, mastery: 54 },
      { week: 6, mastery: 51 },
      { week: 7, mastery: 62 },
      { week: 8, mastery: 68 },
      { week: 9, mastery: 66 },
      { week: 10, mastery: 74 },
    ],
  },
  mentor: {
    summary:
      'Aarav has improved steadily in Algebra and Ratios, but Fractions and Geometry are pulling the average down — three of his last five misses were on mixed-number subtraction.',
    recommendedAction: { label: 'Practice: Fractions', topic: 'Fractions' },
  },
  topics: [
    { id: 't-algebra', name: 'Algebra basics', mastery: 92 },
    { id: 't-ratio', name: 'Ratio & proportion', mastery: 88 },
    { id: 't-geometry', name: 'Geometry — angles', mastery: 61 },
    { id: 't-fractions', name: 'Fractions', mastery: 44 },
  ],
  recentTests: [
    { id: 'a-4', date: '2026-09-08', subject: 'Mathematics', topicFocus: 'Fractions', score: 44 },
    { id: 'a-3', date: '2026-09-01', subject: 'Mathematics', topicFocus: 'Geometry', score: 61 },
    {
      id: 'a-2',
      date: '2026-08-25',
      subject: 'Mathematics',
      topicFocus: 'Ratio & proportion',
      score: 88,
    },
    {
      id: 'a-1',
      date: '2026-08-18',
      subject: 'Mathematics',
      topicFocus: 'Algebra basics',
      score: 92,
    },
  ],
};

/** A child with no attempts yet. */
const EMPTY_DASHBOARD = { hasData: false };

/** Which demo parents already have a child. Everyone else starts with none. */
const INITIAL_CHILDREN_BY_EMAIL = { 'priya@example.com': [aarav] };

let childrenByEmail = structuredClone(INITIAL_CHILDREN_BY_EMAIL);
let nextChildNumber = 1;

export function sampleChildrenFor(email) {
  return [...(childrenByEmail[email] ?? [])];
}

export function addSampleChild(email, { fullName, classLevel }) {
  const child = {
    id: `sample-child-${nextChildNumber++}`,
    fullName,
    classLevel,
    board: 'CBSE',
  };
  childrenByEmail[email] = [...(childrenByEmail[email] ?? []), child];
  return child;
}

export function sampleDashboardFor(childId) {
  return childId === SAMPLE_CHILD_ID ? aaravDashboard : EMPTY_DASHBOARD;
}

/** Test helper: restore the initial in-memory state. */
export function resetSampleData() {
  childrenByEmail = structuredClone(INITIAL_CHILDREN_BY_EMAIL);
  nextChildNumber = 1;
}
