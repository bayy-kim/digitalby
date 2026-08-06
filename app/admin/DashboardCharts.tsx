'use client'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface ChartData {
  date: string
  revenue: number
  count: number
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded text-xs text-gray-500 font-body">
        Belum cukup data transaksi untuk menampilkan grafik.
      </div>
    )
  }

  return (
    <div className="w-full h-64 font-body text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#E63946" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#E63946" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tickLine={false} />
          <YAxis tickLine={false} />
          <Tooltip
            formatter={(value: any) => [
              new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)),
              'Pendapatan',
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#E63946"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorRevenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
