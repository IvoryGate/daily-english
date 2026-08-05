import type { CurvePoint, HeatmapDay, TrendPoint } from '@/api/me'

/** GitHub 风格热力图 */
export function Heatmap({ data }: { data: HeatmapDay[] }) {
  const max = Math.max(1, ...data.map((d) => d.reads + d.reviews))
  const intensity = (reads: number, reviews: number): number => {
    const v = reads + reviews
    if (v === 0) return 0
    const ratio = v / max
    if (ratio < 0.2) return 1
    if (ratio < 0.5) return 2
    if (ratio < 0.8) return 3
    return 4
  }
  const levelClass = [
    'bg-muted',
    'bg-primary/25',
    'bg-primary/50',
    'bg-primary/75',
    'bg-primary',
  ]

  return (
    <div className="flex flex-wrap gap-1">
      {data.map((d) => {
        const lvl = intensity(d.reads, d.reviews)
        return (
          <span
            key={d.date}
            title={`${d.date}：读 ${d.reads} 篇，复习 ${d.reviews} 次`}
            className={`size-3 rounded-[3px] ${levelClass[lvl]}`}
          />
        )
      })}
    </div>
  )
}

/** 轻量 SVG 折线图（词汇量曲线） */
export function LineChart({
  data,
  color = 'stroke-primary',
}: {
  data: CurvePoint[]
  color?: string
}) {
  const width = 600
  const height = 120
  const pad = 6
  const n = data.length
  const max = Math.max(1, ...data.map((d) => d.total))
  const stepX = n > 1 ? (width - pad * 2) / (n - 1) : 0
  const points = data
    .map((d, i) => {
      const x = pad + i * stepX
      const y = height - pad - (d.total / max) * (height - pad * 2)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-28 w-full"
      role="img"
      aria-label="词汇量增长曲线"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        className={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data
        .filter((_, i) => i % 10 === 0 || i === n - 1)
        .map((d, i) => (
          <circle
            key={`${d.date}-${i}`}
            cx={pad + i * 10 * stepX}
            cy={height - pad - (d.total / max) * (height - pad * 2)}
            r={2.5}
            className="fill-primary"
          />
        ))}
    </svg>
  )
}

/** 轻量 SVG 柱状图（复习趋势） */
export function BarChart({ data }: { data: TrendPoint[] }) {
  const width = 600
  const height = 120
  const pad = 6
  const n = data.length
  const max = Math.max(1, ...data.map((d) => d.count))
  const slot = (width - pad * 2) / n
  const barW = Math.max(2, slot * 0.7)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-28 w-full"
      role="img"
      aria-label="每日复习次数柱状图"
      preserveAspectRatio="none"
    >
      {data.map((d, i) => {
        const x = pad + i * slot + (slot - barW) / 2
        const h = (d.count / max) * (height - pad * 2)
        const y = height - pad - h
        return (
          <rect
            key={d.date}
            x={x}
            y={y}
            width={barW}
            height={Math.max(h, d.count > 0 ? 2 : 0)}
            className="fill-primary/50"
            rx={1}
          >
            <title>{`${d.date}：复习 ${d.count} 次`}</title>
          </rect>
        )
      })}
    </svg>
  )
}
