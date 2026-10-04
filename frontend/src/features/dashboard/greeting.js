/** "Good morning" / "Good afternoon" / "Good evening" for the given time. */
export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Two-letter initials for avatars, e.g. "Priya Sharma" -> "PS". */
export function initialsOf(fullName) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** "2026-09-08" -> "8 Sep 2026" (locale-independent so it renders the same everywhere). */
export function formatDate(isoDate) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}
