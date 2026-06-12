import './RadarChart.css';

interface RadarChartProps {
  data: { label: string; value: number }[];
  size?: number;
}

const DIMENSIONS = 5;
const ANGLE_STEP = (2 * Math.PI) / DIMENSIONS;
const START_ANGLE = -Math.PI / 2;

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

export function RadarChart({ data, size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 32;
  const levels = [0.2, 0.4, 0.6, 0.8, 1];

  const gridPaths = levels.map((level) => {
    const points = Array.from({ length: DIMENSIONS }, (_, i) => {
      const p = polarToCartesian(cx, cy, maxR * level, START_ANGLE + i * ANGLE_STEP);
      return `${p.x},${p.y}`;
    });
    return points.join(' ');
  });

  const dataPoints = data.map((d, i) => {
    const r = (d.value / 5) * maxR;
    return polarToCartesian(cx, cy, r, START_ANGLE + i * ANGLE_STEP);
  });

  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  const labelPoints = data.map((d, i) => {
    const p = polarToCartesian(cx, cy, maxR + 18, START_ANGLE + i * ANGLE_STEP);
    return { ...p, label: d.label };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridPaths.map((pts, i) => (
        <polygon key={i} points={pts} className="radar-grid" />
      ))}

      {Array.from({ length: DIMENSIONS }, (_, i) => {
        const end = polarToCartesian(cx, cy, maxR, START_ANGLE + i * ANGLE_STEP);
        return <line key={`axis-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} className="radar-axis" />;
      })}

      <polygon points={dataPath} className="radar-data" />

      {dataPoints.map((p, i) => (
        <circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} className="radar-dot" />
      ))}

      {labelPoints.map((lp, i) => (
        <text
          key={`label-${i}`}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="radar-label"
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}
