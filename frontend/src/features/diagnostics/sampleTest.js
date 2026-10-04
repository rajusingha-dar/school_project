/**
 * SAMPLE TEST — "Mission Surveyor", 10 trigonometry questions (see docs/engaging-tests-design.md).
 *
 * DEMO ONLY: the real product must keep correct answers on the server and grade there; they are
 * bundled here so the demo works without a backend. Shapes mirror what the future API should
 * return: visual spec, hints, misconception tags on wrong options, topic tag, points.
 */

/** Wrong-answer patterns: `label` completes "you …", `tip` is the kind next step. */
export const MISCONCEPTIONS = {
  'adjacent-confusion': {
    label: 'mixed up the opposite and adjacent sides',
    tip: 'Opposite is across from the angle; adjacent is the side that touches it (not the longest one).',
  },
  'used-cos': {
    label: 'used cosine where sine was needed',
    tip: 'Sine pairs opposite with hypotenuse. Cosine pairs adjacent with hypotenuse.',
  },
  'used-tan': {
    label: 'used tangent where a different ratio was needed',
    tip: 'Tangent ignores the hypotenuse completely. Check which two sides the question gives you.',
  },
  'inverted-ratio': {
    label: 'flipped the ratio upside down',
    tip: 'Say it in words first: "opposite over hypotenuse". The top and bottom matter.',
  },
  'flipped-tan': {
    label: 'flipped tangent (adjacent over opposite instead of opposite over adjacent)',
    tip: 'Tangent is opposite ÷ adjacent. Label the sides first, then write the fraction.',
  },
  'swapped-30-60': {
    label: 'swapped the 30° and 60° values',
    tip: 'Sine grows as the angle grows: sin 30° is the smaller one (1/2), sin 60° the bigger (√3/2).',
  },
  'forgot-to-add': {
    label: 'found one value but forgot to add the second',
    tip: 'Work out each part separately, then combine them.',
  },
  'found-ladder-length': {
    label: 'found the ladder’s length instead of the height it reaches',
    tip: 'Re-read what is being asked, and mark that side with a ? on the diagram.',
  },
  'tan-rearranged-wrong': {
    label: 'rearranged the tangent formula the wrong way round',
    tip: 'From tan θ = opposite ÷ adjacent: opposite = adjacent × tan θ, and adjacent = opposite ÷ tan θ.',
  },
  'subtracted-instead': {
    label: 'subtracted instead of using sin² + cos² = 1',
    tip: 'The identity is about squares: cos² θ = 1 − sin² θ, so take a square root at the end.',
  },
};

export const SAMPLE_TEST = {
  id: 'sample-trig-mission',
  title: 'Mission Surveyor',
  subject: 'Mathematics',
  chapter: 'Trigonometry',
  intro:
    'You are the surveyor’s apprentice. Measure heights and distances without climbing a thing — every correct answer moves the mission forward.',
  hintCost: 5,
  minimumCorrectPoints: 5,
  questions: [
    {
      id: 'q1',
      level: 'Easy',
      topic: 'Ratio identification',
      story: 'The surveyor sketches a triangle on a napkin.',
      text: 'Which side is opposite the angle θ?',
      visual: {
        type: 'triangle',
        angle: 37,
        labels: { opposite: 'a', adjacent: 'b', hypotenuse: 'c' },
      },
      options: [
        { text: 'Side a' },
        { text: 'Side b', misconception: 'adjacent-confusion' },
        { text: 'Side c', misconception: 'adjacent-confusion' },
        { text: 'All of them', misconception: 'adjacent-confusion' },
      ],
      correctIndex: 0,
      points: 10,
      hints: [
        'Stand at the angle θ and look straight across the triangle.',
        'The side that does NOT touch θ and is not the longest slanted side is the opposite one.',
      ],
      explanation:
        'Side a is across from θ, so it is the opposite side. Side b touches θ (adjacent) and c is the hypotenuse.',
    },
    {
      id: 'q2',
      level: 'Easy',
      topic: 'Sine',
      story: 'A 3-4-5 plank leans against a post.',
      text: 'The opposite side is 3, the adjacent is 4 and the hypotenuse is 5. What is sin θ?',
      visual: {
        type: 'triangle',
        angle: 37,
        labels: { opposite: '3', adjacent: '4', hypotenuse: '5' },
      },
      options: [
        { text: '3/5' },
        { text: '4/5', misconception: 'used-cos' },
        { text: '3/4', misconception: 'used-tan' },
        { text: '5/3', misconception: 'inverted-ratio' },
      ],
      correctIndex: 0,
      points: 10,
      hints: [
        'sin θ compares two particular sides of the triangle.',
        'sin θ = opposite ÷ hypotenuse.',
      ],
      explanation: 'sin θ = opposite ÷ hypotenuse = 3/5.',
    },
    {
      id: 'q3',
      level: 'Easy',
      topic: 'Tangent',
      story: 'Same plank, new question from the surveyor.',
      text: 'For the same triangle, what is tan θ?',
      visual: {
        type: 'triangle',
        angle: 37,
        labels: { opposite: '3', adjacent: '4', hypotenuse: '5' },
      },
      options: [
        { text: '3/4' },
        { text: '4/3', misconception: 'flipped-tan' },
        { text: '3/5', misconception: 'used-cos' },
        { text: '4/5', misconception: 'used-cos' },
      ],
      correctIndex: 0,
      points: 10,
      hints: [
        'tan θ uses the two sides that are NOT the hypotenuse.',
        'tan θ = opposite ÷ adjacent.',
      ],
      explanation: 'tan θ = opposite ÷ adjacent = 3/4.',
    },
    {
      id: 'q4',
      level: 'Medium',
      topic: 'Standard values',
      story: 'The surveyor’s sighting tool is set to 30°.',
      text: 'What is the value of sin 30°?',
      visual: {
        type: 'triangle',
        angle: 30,
        labels: { opposite: '', adjacent: '', hypotenuse: '' },
        angleLabel: '30°',
      },
      explorerOnHint: true,
      options: [
        { text: '1/2' },
        { text: '√3/2', misconception: 'swapped-30-60' },
        { text: '1' },
        { text: '1/√2' },
      ],
      correctIndex: 0,
      points: 15,
      hints: [
        'Try the angle explorer that just appeared: drag the angle to 30° and watch sin θ.',
        'sin 30° is one of the “famous values”: 0, 1/2, 1/√2, √3/2, 1 for 0°, 30°, 45°, 60°, 90°.',
      ],
      explanation:
        'sin 30° = 1/2 — in a 30-60-90 triangle the side opposite 30° is half the hypotenuse.',
    },
    {
      id: 'q5',
      level: 'Medium',
      topic: 'Standard values',
      story: 'Two sighting angles, side by side.',
      text: 'What is cos 60° + sin 30°?',
      visual: { type: 'pair' },
      options: [
        { text: '0' },
        { text: '1/2', misconception: 'forgot-to-add' },
        { text: '1' },
        { text: '√3/2', misconception: 'swapped-30-60' },
      ],
      correctIndex: 2,
      points: 15,
      hints: [
        'Look at the 60° triangle: cos 60° is adjacent ÷ hypotenuse.',
        'cos 60° = 1/2 and sin 30° = 1/2.',
      ],
      explanation: 'cos 60° = 1/2 and sin 30° = 1/2, so the sum is 1/2 + 1/2 = 1.',
    },
    {
      id: 'q6',
      level: 'Medium',
      topic: 'Sine',
      story: 'A kite string is 10 m long and makes a 30° angle with the ground.',
      text: 'How high is the kite above the ground?',
      visual: { type: 'kite', angle: 30, length: 10 },
      options: [
        { text: '5 m' },
        { text: '5√3 m', misconception: 'used-cos' },
        { text: '10 m' },
        { text: '20 m', misconception: 'inverted-ratio' },
      ],
      correctIndex: 0,
      points: 15,
      hints: [
        'The height is the side opposite the 30° angle; the string is the hypotenuse.',
        'height = string × sin 30°.',
      ],
      explanation: 'height = 10 × sin 30° = 10 × 1/2 = 5 m.',
    },
    {
      id: 'q7',
      level: 'Medium',
      topic: 'Tangent',
      story: 'A ladder leans on a wall at 45°, with its foot 3 m from the wall.',
      text: 'How high up the wall does the ladder reach?',
      visual: { type: 'ladder', angle: 45, base: 3 },
      options: [
        { text: '3 m' },
        { text: '3√2 m', misconception: 'found-ladder-length' },
        { text: '6 m', misconception: 'tan-rearranged-wrong' },
        { text: '1.5 m', misconception: 'tan-rearranged-wrong' },
      ],
      correctIndex: 0,
      points: 15,
      hints: [
        'You know the side next to the angle (3 m) and want the side opposite it.',
        'height = 3 × tan 45°, and tan 45° = 1.',
      ],
      explanation:
        'height = 3 × tan 45° = 3 × 1 = 3 m. (3√2 m would be the length of the ladder itself.)',
    },
    {
      id: 'q8',
      level: 'Hard',
      topic: 'Tangent',
      story:
        'The surveyor stands 20 m from a tower and sights its top at a 60° angle of elevation.',
      text: 'How tall is the tower?',
      visual: { type: 'tower', angle: 60, distance: 20 },
      options: [
        { text: '20√3 m' },
        { text: '20/√3 m', misconception: 'tan-rearranged-wrong' },
        { text: '40 m', misconception: 'inverted-ratio' },
        { text: '20 m' },
      ],
      correctIndex: 0,
      points: 20,
      hints: [
        'The tower is opposite the 60° angle; the 20 m ground distance is adjacent.',
        'height = 20 × tan 60°, and tan 60° = √3.',
      ],
      explanation: 'height = 20 × tan 60° = 20√3 m, which is about 34.6 m.',
    },
    {
      id: 'q9',
      level: 'Hard',
      topic: 'Identities',
      story: 'A code-breaker’s lock opens when you find cos θ.',
      text: 'If sin θ = 3/5 and θ is acute, what is cos θ?',
      visual: {
        type: 'triangle',
        angle: 37,
        labels: { opposite: '3', adjacent: '?', hypotenuse: '5' },
      },
      options: [
        { text: '4/5' },
        { text: '3/4', misconception: 'used-tan' },
        { text: '5/4', misconception: 'inverted-ratio' },
        { text: '2/5', misconception: 'subtracted-instead' },
      ],
      correctIndex: 0,
      points: 20,
      hints: [
        'Use sin² θ + cos² θ = 1, or find the missing side of the triangle.',
        'cos² θ = 1 − 9/25 = 16/25.',
      ],
      explanation: 'cos² θ = 1 − (3/5)² = 16/25, so cos θ = 4/5 (positive because θ is acute).',
    },
    {
      id: 'q10',
      level: 'Boss',
      topic: 'Tangent',
      story:
        'From the top of a 30 m lighthouse, the surveyor sees a boat at a 30° angle of depression.',
      text: 'How far is the boat from the base of the lighthouse?',
      visual: { type: 'lighthouse', angle: 30, height: 30 },
      options: [
        { text: '30√3 m' },
        { text: '30 m', misconception: 'tan-rearranged-wrong' },
        { text: '10√3 m', misconception: 'tan-rearranged-wrong' },
        { text: '60 m', misconception: 'inverted-ratio' },
      ],
      correctIndex: 0,
      points: 25,
      hints: [
        'The angle of depression equals the angle at the boat, inside the triangle (alternate angles).',
        'tan 30° = 30 ÷ distance, so distance = 30 ÷ tan 30°.',
      ],
      explanation:
        'The angle at the boat is also 30°. tan 30° = 30 ÷ d, so d = 30 ÷ (1/√3) = 30√3 m, about 52 m.',
    },
  ],
};

export const MAX_POINTS = SAMPLE_TEST.questions.reduce((sum, question) => sum + question.points, 0);
