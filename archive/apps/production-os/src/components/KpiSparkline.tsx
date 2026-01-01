type KpiSparklineProps = {
  values: Array<number | null>;
  stroke?: string;
  className?: string;
};

function buildPoints(values: Array<number | null>, width: number, height: number) {
  const entries = values
    .map((value, index) => ({ value, index }))
    .filter((entry): entry is { value: number; index: number } => typeof entry.value === "number");

  if (entries.length < 2) return null;

  const min = Math.min(...entries.map((entry) => entry.value));
  const max = Math.max(...entries.map((entry) => entry.value));
  const range = max - min || 1;
  const divisor = values.length > 1 ? values.length - 1 : 1;

  return entries.map((entry) => {
    const x = (entry.index / divisor) * width;
    const y = height - ((entry.value - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
}

export default function KpiSparkline({ values, stroke = "var(--accent)", className }: KpiSparklineProps) {
  const width = 120;
  const height = 36;
  const points = buildPoints(values, width, height);

  if (!points) {
    return (
      <div
        className={`flex h-10 w-full items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--muted)] ${className ?? ""}`}
      >
        n/a
      </div>
    );
  }

  const lastPoint = points[points.length - 1];
  const [lastX, lastY] = lastPoint.split(",").map((value) => Number(value));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`h-10 w-full ${className ?? ""}`}
      role="img"
      aria-label="KPI trend"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(" ")}
      />
      <circle cx={lastX} cy={lastY} r="3" fill={stroke} />
    </svg>
  );
}
