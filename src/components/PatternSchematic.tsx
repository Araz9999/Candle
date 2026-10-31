import type { PatternDefinition } from '../types/market';

interface PatternSchematicProps {
  pattern: PatternDefinition;
  candleStyle?: 'modern' | 'matriks';
  isDark?: boolean;
  height?: number;
}

export function PatternSchematic({
  pattern,
  candleStyle = 'matriks',
  isDark = true,
  height = 156,
}: PatternSchematicProps) {
  const { bars, confirmY, stopY } = pattern.schematic;
  const width = 280;
  const padTop = 18;
  const padBottom = 22;
  const padLeft = 18;
  const padRight = 64;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const yFromVal = (val: number) => {
    const clamped = Math.max(4, Math.min(96, val));
    return padTop + ((100 - clamped) / 92) * plotH;
  };

  const stepX = plotW / Math.max(bars.length, 1);
  const candleWidth = Math.min(20, stepX * 0.48);

  let boxStartIdx = -1;
  let boxEndIdx = -1;
  let boxMax = -Infinity;
  let boxMin = Infinity;

  bars.forEach((b, idx) => {
    if (b.inBox) {
      if (boxStartIdx === -1) boxStartIdx = idx;
      boxEndIdx = idx;
      if (b.high > boxMax) boxMax = b.high;
      if (b.low < boxMin) boxMin = b.low;
    }
  });

  const isBull = pattern.direction === 'bullish';
  const boxColor = isBull ? '#16A34A' : '#DC2626';
  const wickStroke = isDark ? '#CBD5E1' : '#1E293B';

  const boxX1 = boxStartIdx >= 0 ? padLeft + boxStartIdx * stepX + stepX * 0.5 - candleWidth * 0.85 : 0;
  const boxX2 = boxEndIdx >= 0 ? padLeft + boxEndIdx * stepX + stepX * 0.5 + candleWidth * 0.85 : 0;
  const boxY1 = boxStartIdx >= 0 ? yFromVal(boxMax) - 6 : 0;
  const boxY2 = boxStartIdx >= 0 ? yFromVal(boxMin) + 6 : 0;

  const confirmLineY = yFromVal(confirmY);
  const stopLineY = yFromVal(stopY);
  const rayStartX = boxEndIdx >= 0 ? boxX2 : padLeft + plotW * 0.5;
  const rayEndX = width - 8;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full select-none rounded-md bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800"
      style={{ height }}
      role="img"
      aria-label={`${pattern.englishName} (${pattern.turkishName}) şematik mum grafiği`}
    >
      {/* Subtle horizontal reference grid */}
      {[25, 50, 75].map((g) => (
        <line
          key={g}
          x1={padLeft}
          y1={yFromVal(g)}
          x2={width - padRight}
          y2={yFromVal(g)}
          stroke={isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)'}
          strokeDasharray="2 3"
        />
      ))}

      {/* Matriks Pattern Bounding Box */}
      {boxStartIdx >= 0 && (
        <rect
          x={boxX1}
          y={boxY1}
          width={Math.max(12, boxX2 - boxX1)}
          height={Math.max(12, boxY2 - boxY1)}
          fill={isBull ? 'rgba(22,163,74,0.07)' : 'rgba(220,38,38,0.07)'}
          stroke={boxColor}
          strokeWidth={1.6}
          rx={2}
        />
      )}

      {/* Confirmation (Teyit) Ray */}
      <line
        x1={rayStartX}
        y1={confirmLineY}
        x2={rayEndX}
        y2={confirmLineY}
        stroke="#16A34A"
        strokeWidth={1.5}
      />
      <text
        x={rayEndX - 2}
        y={confirmLineY - 4}
        textAnchor="end"
        className="text-[9px] font-mono font-semibold fill-emerald-600 dark:fill-emerald-400"
      >
        TEYİT
      </text>

      {/* Stoploss Ray */}
      <line
        x1={rayStartX}
        y1={stopLineY}
        x2={rayEndX}
        y2={stopLineY}
        stroke="#DC2626"
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
      <text
        x={rayEndX - 2}
        y={stopLineY + 10}
        textAnchor="end"
        className="text-[9px] font-mono font-semibold fill-red-600 dark:fill-red-400"
      >
        STOP
      </text>

      {/* Candles */}
      {bars.map((b, idx) => {
        const cx = padLeft + idx * stepX + stepX * 0.5;
        const yHigh = yFromVal(b.high);
        const yLow = yFromVal(b.low);
        const yOpen = yFromVal(b.open);
        const yClose = yFromVal(b.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(1.8, Math.abs(yClose - yOpen));
        const barBull = b.close >= b.open;
        const isDoji = Math.abs(b.close - b.open) <= 1.2;

        let fill = '#16A34A';
        let stroke = '#16A34A';

        if (candleStyle === 'matriks') {
          if (isDoji) {
            fill = wickStroke;
            stroke = wickStroke;
          } else if (barBull) {
            fill = isDark ? '#F8FAFC' : '#FFFFFF';
            stroke = isDark ? '#E2E8F0' : '#0F172A';
          } else {
            fill = isDark ? '#1E293B' : '#0F172A';
            stroke = isDark ? '#94A3B8' : '#0F172A';
          }
        } else {
          fill = barBull ? '#16A34A' : '#DC2626';
          stroke = barBull ? '#16A34A' : '#DC2626';
        }

        return (
          <g key={idx}>
            <line
              x1={cx}
              y1={yHigh}
              x2={cx}
              y2={yLow}
              stroke={candleStyle === 'matriks' ? wickStroke : stroke}
              strokeWidth={1.4}
            />
            <rect
              x={cx - candleWidth / 2}
              y={bodyTop}
              width={candleWidth}
              height={bodyHeight}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.3}
              rx={0.5}
            />
          </g>
        );
      })}
    </svg>
  );
}
