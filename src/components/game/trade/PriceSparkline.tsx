interface PriceSparklineProps {
  data: number[];
  width?: number;
  height?: number;
}

export function PriceSparkline({ data, width = 48, height = 20 }: PriceSparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const trending = data[data.length - 1] > data[0];

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={trending ? 'hsl(var(--blood))' : 'hsl(var(--emerald))'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * width}
        cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2"
        fill={trending ? 'hsl(var(--blood))' : 'hsl(var(--emerald))'}
      />
    </svg>
  );
}
