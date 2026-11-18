import styles from './LineChart.module.css';

export interface ChartLine {
  value: number;
  label: string;
}

interface LineChartProps {
  /** Text equivalent of the chart; its accessible name (V1). */
  label: string;
  points: readonly number[];
  /** One label per point, e.g. "1. hafta". */
  labels: readonly string[];
  /** Grid values from bottom to top; the first and last set the vertical scale. */
  yTicks: readonly number[];
  target?: ChartLine;
  /** Class average; leave out for grades 1 and 2 (docs/urun.md section 2). */
  average?: ChartLine;
  className?: string;
}

interface Layout {
  name: 'compact' | 'wide';
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  labelY: number;
}

// Geometry of the V1 chart: 312 × 190 on phones, 640 × 320 on tablet and web.
const layouts: readonly Layout[] = [
  {
    name: 'compact',
    width: 312,
    height: 190,
    left: 38,
    right: 278,
    top: 37.3,
    bottom: 160,
    labelY: 182,
  },
  {
    name: 'wide',
    width: 640,
    height: 320,
    left: 38,
    right: 606,
    top: 51.8,
    bottom: 290,
    labelY: 312,
  },
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function Chart({
  layout,
  label,
  points,
  labels,
  yTicks,
  target,
  average,
}: LineChartProps & { layout: Layout }) {
  const minTick = yTicks[0] ?? 0;
  const maxTick = yTicks[yTicks.length - 1] ?? minTick + 1;
  const y = (value: number) =>
    round1(
      layout.bottom - ((value - minTick) / (maxTick - minTick)) * (layout.bottom - layout.top),
    );
  const step = points.length > 1 ? (layout.right - layout.left) / (points.length - 1) : 0;
  const x = (index: number) => round1(layout.left + index * step);
  const lastIndex = points.length - 1;
  const lastValue = points[lastIndex];

  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${String(layout.width)} ${String(layout.height)}`}
      className={`${styles.chart} ${styles[layout.name]}`}
    >
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            className={styles.grid}
            x1={layout.left}
            x2={layout.right}
            y1={y(tick)}
            y2={y(tick)}
          />
          <text className={styles.axis} x={layout.left - 8} y={y(tick) + 4} textAnchor="end">
            {tick}
          </text>
        </g>
      ))}
      {average && (
        <g data-line="average">
          <line
            className={styles.average}
            x1={layout.left}
            x2={layout.right}
            y1={y(average.value)}
            y2={y(average.value)}
          />
          <text
            className={styles.averageLabel}
            x={layout.right}
            y={y(average.value) - 8}
            textAnchor="end"
          >
            {average.label}
          </text>
        </g>
      )}
      {target && (
        <g data-line="target">
          <line
            className={styles.target}
            x1={layout.left}
            x2={layout.right}
            y1={y(target.value)}
            y2={y(target.value)}
          />
          <text className={styles.targetLabel} x={layout.left + 8} y={y(target.value) - 8}>
            {target.label}
          </text>
        </g>
      )}
      <polyline
        className={styles.line}
        points={points.map((value, index) => `${String(x(index))},${String(y(value))}`).join(' ')}
      />
      {points.map((value, index) => (
        <g key={labels[index] ?? index}>
          <circle
            data-point={index === lastIndex ? 'last' : 'past'}
            className={index === lastIndex ? styles.lastPoint : styles.point}
            cx={x(index)}
            cy={y(value)}
            r={index === lastIndex ? 9 : 6.5}
          />
          <text
            className={index === lastIndex ? styles.lastLabel : styles.axis}
            x={x(index)}
            y={layout.labelY}
            textAnchor="middle"
          >
            {labels[index]}
          </text>
        </g>
      ))}
      {lastValue !== undefined && (
        <text className={styles.value} x={x(lastIndex) - 4} y={y(lastValue) - 16} textAnchor="end">
          {lastValue}
        </text>
      )}
    </svg>
  );
}

/**
 * Six-week line with an optional target line (dashed amber) and class-average line (dotted).
 * The design draws separate phone and wide versions; both are rendered and CSS shows one.
 */
export function LineChart(props: LineChartProps) {
  return (
    <div className={[styles.wrap, props.className ?? ''].filter(Boolean).join(' ')}>
      {layouts.map((layout) => (
        <Chart key={layout.name} layout={layout} {...props} />
      ))}
    </div>
  );
}
