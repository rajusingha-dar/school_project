import { useState } from 'react';

/**
 * Code-generated SVG diagrams for test questions. Geometry is computed from the question's
 * numbers (never AI-drawn), so a 30° angle is really drawn at 30°.
 */

const FOREST = '#1E3A34';
const AMBER = '#E3A23D';
const SAGE = '#6B8F7F';
const TINT = '#EEF3EF';
const INK_SOFT = '#4B5B54';

const toRad = (degrees) => (degrees * Math.PI) / 180;

/** SVG arc from one angle to another (degrees, counter-clockwise from +x on screen). */
function arcPath(cx, cy, radius, fromDeg, toDeg) {
  const start = [cx + radius * Math.cos(toRad(fromDeg)), cy - radius * Math.sin(toRad(fromDeg))];
  const end = [cx + radius * Math.cos(toRad(toDeg)), cy - radius * Math.sin(toRad(toDeg))];
  return `M${start[0].toFixed(1)} ${start[1].toFixed(1)} A${radius} ${radius} 0 0 0 ${end[0].toFixed(1)} ${end[1].toFixed(1)}`;
}

function polar(cx, cy, radius, degrees) {
  return [cx + radius * Math.cos(toRad(degrees)), cy - radius * Math.sin(toRad(degrees))];
}

function Svg({ label, children, height = 210 }) {
  return (
    <svg
      className="visual-svg"
      viewBox={`0 0 360 ${height}`}
      role="img"
      aria-label={label}
      fontFamily="Inter, sans-serif"
    >
      {children}
    </svg>
  );
}

function RightAngleMark({ x, y, size = 12, facing = 'left' }) {
  const dx = facing === 'left' ? -size : size;
  return (
    <path
      d={`M${x + dx} ${y} L${x + dx} ${y - size} L${x} ${y - size}`}
      fill="none"
      stroke={INK_SOFT}
    />
  );
}

function SideLabel({ x, y, anchor = 'middle', children }) {
  if (!children) return null;
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize="15" fontWeight="700" fill={FOREST}>
      {children}
    </text>
  );
}

/** Right triangle with the right angle at the bottom-right and θ at the bottom-left. */
export function TriangleDiagram({ angle, labels = {}, angleLabel = 'θ', highlight = null }) {
  const height = 210;
  const rad = toRad(angle);
  const adjacent = Math.min(250, 140 / Math.tan(rad));
  const opposite = adjacent * Math.tan(rad);
  const ax = 40;
  const ay = height - 36;
  const bx = ax + adjacent;
  const cy = ay - opposite;
  const stroke = (side) => (highlight === side ? AMBER : FOREST);
  const width = (side) => (highlight === side ? 5 : 3);
  const [labelX, labelY] = polar(ax, ay, 36 + 16, angle / 2);

  return (
    <Svg label={`Right triangle with an angle of ${angleLabel}`} height={height}>
      <polygon points={`${ax},${ay} ${bx},${ay} ${bx},${cy}`} fill={TINT} />
      <line
        x1={ax}
        y1={ay}
        x2={bx}
        y2={ay}
        stroke={stroke('adjacent')}
        strokeWidth={width('adjacent')}
        strokeLinecap="round"
      />
      <line
        x1={bx}
        y1={ay}
        x2={bx}
        y2={cy}
        stroke={stroke('opposite')}
        strokeWidth={width('opposite')}
        strokeLinecap="round"
      />
      <line
        x1={ax}
        y1={ay}
        x2={bx}
        y2={cy}
        stroke={stroke('hypotenuse')}
        strokeWidth={width('hypotenuse')}
        strokeLinecap="round"
      />
      <RightAngleMark x={bx} y={ay} />
      <path d={arcPath(ax, ay, 36, 0, angle)} fill="none" stroke={AMBER} strokeWidth="2.5" />
      <text x={labelX} y={labelY + 5} fontSize="14" fontWeight="700" fill={FOREST}>
        {angleLabel}
      </text>
      <SideLabel x={(ax + bx) / 2} y={ay + 22}>
        {labels.adjacent}
      </SideLabel>
      <SideLabel x={bx + 12} y={(ay + cy) / 2 + 5} anchor="start">
        {labels.opposite}
      </SideLabel>
      <SideLabel x={(ax + bx) / 2 - 12} y={(ay + cy) / 2 - 8} anchor="end">
        {labels.hypotenuse}
      </SideLabel>
    </Svg>
  );
}

/** The 30° and 60° views of the same 30-60-90 triangle, side by side. */
export function PairDiagram() {
  return (
    <div className="visual-pair">
      <figure>
        <TriangleDiagram
          angle={30}
          angleLabel="30°"
          labels={{ opposite: '1', adjacent: '√3', hypotenuse: '2' }}
        />
        <figcaption>Angle 30°</figcaption>
      </figure>
      <figure>
        <TriangleDiagram
          angle={60}
          angleLabel="60°"
          labels={{ opposite: '√3', adjacent: '1', hypotenuse: '2' }}
        />
        <figcaption>Angle 60°</figcaption>
      </figure>
    </div>
  );
}

/** Kite on a string: string length and angle with the ground are known, height is not. */
export function KiteScene({ angle, length }) {
  const ground = 182;
  const origin = [50, ground];
  const stringPx = 250;
  const [kx, ky] = polar(origin[0], origin[1], stringPx, angle);
  const [midX, midY] = polar(origin[0], origin[1], stringPx / 2, angle);
  const [arcLabelX, arcLabelY] = polar(origin[0], origin[1], 62, angle / 2);

  return (
    <Svg label={`A kite on a ${length} metre string at ${angle} degrees to the ground`}>
      <line x1="10" y1={ground} x2="350" y2={ground} stroke={FOREST} strokeWidth="3" />
      <circle cx={origin[0]} cy={ground - 10} r="8" fill={SAGE} />
      <line x1={kx} y1={ky} x2={kx} y2={ground} stroke={INK_SOFT} strokeDasharray="5 5" />
      <RightAngleMark x={kx} y={ground} />
      <line x1={origin[0]} y1={ground} x2={kx} y2={ky} stroke={FOREST} strokeWidth="2.5" />
      <polygon
        points={`${kx},${ky - 22} ${kx + 15},${ky} ${kx},${ky + 22} ${kx - 15},${ky}`}
        fill={AMBER}
        stroke={FOREST}
        strokeWidth="2"
      />
      <path
        d={arcPath(origin[0], ground, 46, 0, angle)}
        fill="none"
        stroke={AMBER}
        strokeWidth="2.5"
      />
      <text
        x={arcLabelX}
        y={arcLabelY + 5}
        fontSize="13"
        fontWeight="700"
        fill={FOREST}
      >{`${angle}°`}</text>
      <SideLabel x={midX - 8} y={midY - 10} anchor="end">{`${length} m`}</SideLabel>
      <SideLabel x={kx + 10} y={(ky + ground) / 2 + 5} anchor="start">
        height = ?
      </SideLabel>
    </Svg>
  );
}

/** Ladder against a wall. */
export function LadderScene({ angle, base }) {
  const ground = 182;
  const wallX = 300;
  const basePx = 140;
  const footX = wallX - basePx;
  const topY = ground - basePx * Math.tan(toRad(angle));

  return (
    <Svg
      label={`A ladder leaning on a wall at ${angle} degrees, foot ${base} metres from the wall`}
    >
      <rect
        x={wallX}
        y={20}
        width="26"
        height={ground - 20}
        fill={TINT}
        stroke={FOREST}
        strokeWidth="3"
      />
      <line x1="10" y1={ground} x2="350" y2={ground} stroke={FOREST} strokeWidth="3" />
      <line
        x1={footX}
        y1={ground}
        x2={wallX}
        y2={topY}
        stroke={AMBER}
        strokeWidth="6"
        strokeLinecap="round"
      />
      <RightAngleMark x={wallX} y={ground} />
      <path
        d={arcPath(footX, ground, 40, 0, angle)}
        fill="none"
        stroke={FOREST}
        strokeWidth="2.5"
      />
      <text
        x={footX + 48}
        y={ground - 8}
        fontSize="13"
        fontWeight="700"
        fill={FOREST}
      >{`${angle}°`}</text>
      <line x1={footX} y1={ground + 14} x2={wallX} y2={ground + 14} stroke={INK_SOFT} />
      <SideLabel x={(footX + wallX) / 2} y={ground + 28}>{`${base} m`}</SideLabel>
      <SideLabel x={wallX - 10} y={(topY + ground) / 2} anchor="end">
        height = ?
      </SideLabel>
    </Svg>
  );
}

/** Surveyor looking up at a tower (angle of elevation). */
export function TowerScene({ angle, distance }) {
  const ground = 188;
  const personX = 70;
  const towerX = 190;
  const topY = ground - (towerX - personX) * Math.tan(toRad(angle));

  return (
    <Svg
      label={`A surveyor ${distance} metres from a tower sees its top at ${angle} degrees of elevation`}
    >
      <line x1="10" y1={ground} x2="350" y2={ground} stroke={FOREST} strokeWidth="3" />
      <rect
        x={towerX}
        y={topY}
        width="30"
        height={ground - topY}
        fill={TINT}
        stroke={FOREST}
        strokeWidth="3"
      />
      <circle cx={personX} cy={ground - 12} r="8" fill={SAGE} />
      <line
        x1={personX}
        y1={ground - 12}
        x2={towerX}
        y2={topY}
        stroke={AMBER}
        strokeWidth="3"
        strokeDasharray="7 5"
      />
      <path
        d={arcPath(personX, ground - 12, 42, 0, angle)}
        fill="none"
        stroke={FOREST}
        strokeWidth="2.5"
      />
      <text
        x={personX + 50}
        y={ground - 22}
        fontSize="13"
        fontWeight="700"
        fill={FOREST}
      >{`${angle}°`}</text>
      <line x1={personX} y1={ground + 12} x2={towerX} y2={ground + 12} stroke={INK_SOFT} />
      <SideLabel x={(personX + towerX) / 2} y={ground + 26}>{`${distance} m`}</SideLabel>
      <SideLabel x={towerX + 40} y={(topY + ground) / 2} anchor="start">
        height = ?
      </SideLabel>
    </Svg>
  );
}

/** Looking down from a lighthouse at a boat (angle of depression). */
export function LighthouseScene({ angle, height }) {
  const sea = 188;
  const towerX = 60;
  const topY = 70;
  const boatX = towerX + (sea - topY) / Math.tan(toRad(angle));
  const [labelX, labelY] = polar(towerX, topY, 56, -angle / 2);

  return (
    <Svg label={`A boat seen from a ${height} metre lighthouse at ${angle} degrees of depression`}>
      <rect x="10" y={sea} width="340" height="14" fill={TINT} />
      <line x1="10" y1={sea} x2="350" y2={sea} stroke={FOREST} strokeWidth="3" />
      <rect
        x={towerX - 14}
        y={topY}
        width="28"
        height={sea - topY}
        fill="#fff"
        stroke={FOREST}
        strokeWidth="3"
      />
      <rect
        x={towerX - 10}
        y={topY - 14}
        width="20"
        height="14"
        fill={AMBER}
        stroke={FOREST}
        strokeWidth="2"
      />
      <line x1={towerX} y1={topY} x2="350" y2={topY} stroke={INK_SOFT} strokeDasharray="5 5" />
      <line
        x1={towerX}
        y1={topY}
        x2={boatX}
        y2={sea}
        stroke={AMBER}
        strokeWidth="3"
        strokeDasharray="7 5"
      />
      <path
        d={arcPath(towerX, topY, 56, -angle, 0)}
        fill="none"
        stroke={FOREST}
        strokeWidth="2.5"
      />
      <text
        x={labelX + 6}
        y={labelY + 16}
        fontSize="13"
        fontWeight="700"
        fill={FOREST}
      >{`${angle}°`}</text>
      <polygon
        points={`${boatX - 16},${sea - 4} ${boatX + 16},${sea - 4} ${boatX + 9},${sea + 10} ${boatX - 9},${sea + 10}`}
        fill={SAGE}
        stroke={FOREST}
        strokeWidth="2"
      />
      <SideLabel
        x={towerX + 22}
        y={(topY + sea) / 2 + 20}
        anchor="start"
      >{`${height} m`}</SideLabel>
      <SideLabel x={(towerX + boatX) / 2} y={sea + 30}>
        distance = ?
      </SideLabel>
    </Svg>
  );
}

/** Interactive angle explorer: drag the angle and watch sin θ. Unlocked by a hint. */
export function TriangleExplorer() {
  const [angle, setAngle] = useState(45);
  const hypotenuse = 150;
  const height = 190;
  const ax = 40;
  const ay = height - 20;
  const [cx, cy] = polar(ax, ay, hypotenuse, angle);
  const opposite = hypotenuse * Math.sin(toRad(angle));
  const sine = Math.sin(toRad(angle));

  return (
    <div className="explorer">
      <svg
        className="visual-svg"
        viewBox={`0 0 360 ${height}`}
        role="img"
        aria-label={`Triangle with angle ${angle} degrees`}
      >
        <polygon points={`${ax},${ay} ${cx},${ay} ${cx},${cy}`} fill={TINT} />
        <line x1={ax} y1={ay} x2={cx} y2={ay} stroke={FOREST} strokeWidth="3" />
        <line
          x1={cx}
          y1={ay}
          x2={cx}
          y2={cy}
          stroke={AMBER}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line x1={ax} y1={ay} x2={cx} y2={cy} stroke={FOREST} strokeWidth="3" />
        <path
          d={arcPath(ax, ay, 34, 0, Math.max(angle, 1))}
          fill="none"
          stroke={AMBER}
          strokeWidth="2.5"
        />
        <text x={cx + 12} y={(ay + cy) / 2 + 5} fontSize="13" fill={FOREST} fontWeight="700">
          opposite ≈ {(opposite / hypotenuse).toFixed(2)}
        </text>
        <text
          x={(ax + cx) / 2 - 10}
          y={(ay + cy) / 2 - 10}
          textAnchor="end"
          fontSize="13"
          fill={FOREST}
          fontWeight="700"
        >
          hypotenuse = 1
        </text>
      </svg>
      <label className="explorer-control">
        Angle: <strong>{angle}°</strong>
        <input
          type="range"
          min="1"
          max="89"
          value={angle}
          onChange={(event) => setAngle(Number(event.target.value))}
          aria-label="Angle in degrees"
        />
      </label>
      <p className="explorer-readout">
        sin θ = opposite ÷ hypotenuse ≈ <strong>{sine.toFixed(2)}</strong>
      </p>
    </div>
  );
}

/** Pick the diagram for a question's visual spec. */
export function QuestionVisual({ visual }) {
  switch (visual.type) {
    case 'triangle':
      return (
        <TriangleDiagram
          angle={visual.angle}
          labels={visual.labels}
          angleLabel={visual.angleLabel}
          highlight={visual.highlight}
        />
      );
    case 'pair':
      return <PairDiagram />;
    case 'kite':
      return <KiteScene angle={visual.angle} length={visual.length} />;
    case 'ladder':
      return <LadderScene angle={visual.angle} base={visual.base} />;
    case 'tower':
      return <TowerScene angle={visual.angle} distance={visual.distance} />;
    case 'lighthouse':
      return <LighthouseScene angle={visual.angle} height={visual.height} />;
    default:
      return null;
  }
}
