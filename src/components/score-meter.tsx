interface ScoreMeterProps {
  value: number;
  size?: number;
}

function strokeFor(value: number): string {
  if (value >= 0.7) return "var(--success)";
  if (value >= 0.45) return "var(--brand)";
  return "var(--warning)";
}

/** Quiet circular match-score gauge; the stroke draws in on mount. */
export function ScoreMeter({ value, size = 52 }: ScoreMeterProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
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
          stroke={strokeFor(clamped)}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
          className="animate-ring"
          style={{ "--ring-circumference": circumference } as React.CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold leading-none tracking-tight tabular-nums">
          {Math.round(clamped * 100)}
        </span>
        <span className="mt-1 text-[9px] leading-none text-muted-foreground">match</span>
      </div>
      <span className="sr-only">Overall match {Math.round(clamped * 100)} percent</span>
    </div>
  );
}
