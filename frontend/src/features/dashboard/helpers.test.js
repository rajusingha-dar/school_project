import { describe, expect, it } from 'vitest';
import { buildCurve, CHART } from '../curve/curveGeometry';
import { masteryBand } from '../diagnostics/mastery';
import { formatDate, greetingFor, initialsOf } from './greeting';

describe('masteryBand', () => {
  it('maps scores to strong / watch / weak at the boundaries', () => {
    expect(masteryBand(92).key).toBe('strong');
    expect(masteryBand(75).key).toBe('strong');
    expect(masteryBand(74).key).toBe('watch');
    expect(masteryBand(50).key).toBe('watch');
    expect(masteryBand(49).key).toBe('weak');
    expect(masteryBand(0).key).toBe('weak');
  });
});

describe('greeting helpers', () => {
  it('greets by time of day', () => {
    expect(greetingFor(new Date(2026, 8, 8, 9))).toBe('Good morning');
    expect(greetingFor(new Date(2026, 8, 8, 12))).toBe('Good afternoon');
    expect(greetingFor(new Date(2026, 8, 8, 17))).toBe('Good evening');
  });

  it('builds initials and formats dates', () => {
    expect(initialsOf('Priya Sharma')).toBe('PS');
    expect(initialsOf('  rekha  ')).toBe('R');
    expect(formatDate('2026-09-08')).toBe('8 Sep 2026');
  });
});

describe('buildCurve', () => {
  const points = [
    { week: 1, mastery: 0 },
    { week: 2, mastery: 50 },
    { week: 3, mastery: 100 },
  ];

  it('places points left-to-right and higher mastery higher on screen', () => {
    const { coords } = buildCurve(points);
    expect(coords[0].x).toBe(CHART.left);
    expect(coords[2].x).toBe(CHART.width - CHART.right);
    expect(coords[0].y).toBeGreaterThan(coords[1].y);
    expect(coords[1].y).toBeGreaterThan(coords[2].y);
  });

  it('produces a smooth path starting with a move and using curves', () => {
    const { path } = buildCurve(points);
    expect(path.startsWith('M')).toBe(true);
    expect(path.match(/C/g)).toHaveLength(2);
  });

  it('keeps every curve control point inside the plot area', () => {
    const spiky = [0, 100, 0, 100, 0].map((mastery, index) => ({ week: index + 1, mastery }));
    const { path } = buildCurve(spiky);
    const ys = [...path.matchAll(/(-?\d+\.?\d*) (-?\d+\.?\d*)/g)].map((match) => Number(match[2]));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(CHART.top);
    expect(Math.max(...ys)).toBeLessThanOrEqual(CHART.height - CHART.bottom);
  });

  it('handles empty and single-point series', () => {
    expect(buildCurve([]).path).toBe('');
    expect(buildCurve([{ week: 1, mastery: 40 }]).path.startsWith('M')).toBe(true);
  });
});
