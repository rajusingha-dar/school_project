/** LearnCurve logo mark (amber square with a rising line). */
export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#E3A23D" />
      <path
        d="M8 21 L13 14 L18 18 L24 9"
        stroke="#142722"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
