interface ScoreMeterProps {
  value: number;
  size?: number;
}

function toneFor(value: number): string {
  if (value >= 0.7) return "var(--success)";
  if (value >= 0.45) return "var(--brand)";
  return "var(--warning)";
}

/** Circular match-score indicator. */
export function ScoreMeter({ value, size = 56 }: ScoreMeterProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      title={`Overall match ${Math.round(clamped * 100)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={toneFor(clamped)}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold leading-none tabular-nums">
          {Math.round(clamped * 100)}
        </span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
          match
        </span>
      </div>
    </div>
  );
}
