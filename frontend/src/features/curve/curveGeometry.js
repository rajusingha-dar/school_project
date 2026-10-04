export const CHART = {
  width: 620,
  height: 230,
  left: 40,
  right: 12,
  top: 14,
  bottom: 28,
};

/**
 * Convert weekly mastery points into SVG coordinates and a smooth path.
 *
 * @param {Array<{week: number, mastery: number}>} points mastery 0-100, in week order
 * @returns {{coords: Array<{x: number, y: number, week: number, mastery: number}>, path: string}}
 */
export function buildCurve(points) {
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  const lastIndex = Math.max(points.length - 1, 1);

  const coords = points.map((point, index) => ({
    ...point,
    x: CHART.left + (index / lastIndex) * plotWidth,
    y: CHART.top + (1 - Math.min(Math.max(point.mastery, 0), 100) / 100) * plotHeight,
  }));

  return { coords, path: smoothPath(coords) };
}

/** y position of a mastery value (for gridlines). */
export function yForMastery(mastery) {
  const plotHeight = CHART.height - CHART.top - CHART.bottom;
  return CHART.top + (1 - mastery / 100) * plotHeight;
}

/** Catmull-Rom spline converted to cubic Béziers, with control points kept inside the plot. */
function smoothPath(coords) {
  if (coords.length === 0) return '';
  if (coords.length === 1) return `M${coords[0].x} ${coords[0].y}`;

  const yMin = CHART.top;
  const yMax = CHART.height - CHART.bottom;
  const clampY = (y) => Math.min(Math.max(y, yMin), yMax);
  const round = (value) => Math.round(value * 10) / 10;

  let path = `M${round(coords[0].x)} ${round(coords[0].y)}`;
  for (let i = 0; i < coords.length - 1; i += 1) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clampY(p2.y - (p3.y - p1.y) / 6);
    path += ` C${round(c1x)} ${round(c1y)}, ${round(c2x)} ${round(c2y)}, ${round(p2.x)} ${round(p2.y)}`;
  }
  return path;
}
