import { buildCurve, CHART, yForMastery } from './curveGeometry';

const GRID_LEVELS = [0, 25, 50, 75, 100];

/** Weekly mastery line chart drawn as SVG (no chart library). */
export function LearningCurveChart({ points }) {
  const { coords, path } = buildCurve(points);
  const first = coords[0];
  const last = coords[coords.length - 1];
  const middle = coords[Math.floor((coords.length - 1) / 2)];
  const description = `Mastery rose from ${first.mastery}% in week ${first.week} to ${last.mastery}% in week ${last.week}.`;

  return (
    <svg
      className="curve-svg"
      viewBox={`0 0 ${CHART.width} ${CHART.height}`}
      role="img"
      aria-label={description}
    >
      {GRID_LEVELS.map((level) => (
        <g key={level}>
          <line
            x1={CHART.left}
            x2={CHART.width - CHART.right}
            y1={yForMastery(level)}
            y2={yForMastery(level)}
            stroke={level === 0 ? '#D8E2DB' : '#EEF3EF'}
          />
          <text
            x={CHART.left - 8}
            y={yForMastery(level) + 4}
            fontSize="11"
            textAnchor="end"
            fill="#4B5B54"
          >
            {level}%
          </text>
        </g>
      ))}

      <path d={path} fill="none" stroke="#E3A23D" strokeWidth="3" strokeLinecap="round" />

      <g fill="#E3A23D">
        {coords.map((point) => (
          <circle
            key={point.week}
            cx={point.x}
            cy={point.y}
            r={point === last ? 5 : 4}
            stroke={point === last ? '#fff' : 'none'}
            strokeWidth="2"
          >
            <title>{`Week ${point.week}: ${point.mastery}%`}</title>
          </circle>
        ))}
      </g>

      {[first, middle, last].map((point, index) => (
        <text
          key={point.week}
          x={point.x}
          y={CHART.height - 6}
          fontSize="11"
          fill="#4B5B54"
          textAnchor={index === 0 ? 'start' : index === 2 ? 'end' : 'middle'}
        >
          {`Wk ${point.week}`}
        </text>
      ))}
    </svg>
  );
}
