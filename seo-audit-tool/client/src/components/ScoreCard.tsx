interface ScoreCardProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ScoreCard({ score, label = 'Site Health', size = 'lg' }: ScoreCardProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // green
    if (score >= 60) return '#F59E0B'; // orange
    return '#EF4444'; // red
  };

  const color = getScoreColor(score);

  const sizes = {
    sm: { outer: 80, stroke: 6, fontSize: 'text-xl', labelSize: 'text-xs' },
    md: { outer: 120, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { outer: 180, stroke: 12, fontSize: 'text-5xl', labelSize: 'text-base' },
  };

  const { outer, stroke, fontSize, labelSize } = sizes[size];
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = ((100 - score) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg
          className="transform -rotate-90"
          width={outer}
          height={outer}
        >
          {/* Background circle */}
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="score-circle"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold`} style={{ color }}>
            {score}%
          </span>
        </div>
      </div>
      <p className={`mt-3 ${labelSize} font-medium text-gray-700`}>{label}</p>
    </div>
  );
}
