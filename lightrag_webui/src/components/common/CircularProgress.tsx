interface CircularProgressProps {
  value: number
  color: string
}

export const CircularProgress = ({ value, color }: CircularProgressProps) => {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = 28

  return (
    <svg className="h-14 w-14">
      <circle
        className="text-gray-100"
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
        r={radius}
        cx={center}
        cy={center}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <circle
        className={`text-${color}-600`}
        strokeWidth="4"
        stroke="currentColor"
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        r={radius}
        cx={center}
        cy={center}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text
        x={center}
        y={center}
        textAnchor="middle"
        dominantBaseline="middle"
        className={'text-lg font-bold text-gray-900'}
      >
        {value}
        <tspan className="ml-0.5 text-sm font-normal text-gray-300">%</tspan>
      </text>
    </svg>
  )
}

