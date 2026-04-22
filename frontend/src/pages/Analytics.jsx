import { useEffect, useState } from 'react'
import { getDailySales, getTopSelling } from '../api/inventory'
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart } from 'recharts'
import { RefreshCw, TrendingUp } from 'lucide-react'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 500 }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

export default function Analytics() {
  const [daily,   setDaily]   = useState([])
  const [topSell, setTopSell] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([getDailySales(14), getTopSelling(14)])
      .then(([d, t]) => {
        const withMA = d.map((row, i) => {
          const slice = d.slice(Math.max(0, i - 6), i + 1)
          const avg = slice.reduce((s, x) => s + x.total, 0) / slice.length
          return { ...row, ma: Math.round(avg * 10) / 10 }
        })
        setDaily(withMA); setTopSell(t); setLoading(false)
      }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <RefreshCw size={20} color="var(--text-muted)" />
    </div>
  )

  const maxSold = topSell.length ? Math.max(...topSell.map(p => p.totalSold)) : 1
  const dateLabel = d => { const dt = new Date(d); return `${dt.getDate()}/${dt.getMonth() + 1}` }

  return (
    <div className="page-animate">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Analytics</div>
          <div className="page-subtitle">Sales trends · Demand forecast · Top products</div>
        </div>
        <button className="btn" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      {/* Sales chart */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14 }}>Daily sales — last 14 days</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Bars = actual sales · Line = demand forecast (7-day average)
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, background: 'var(--green)', borderRadius: 2, display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Sales</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 2, background: 'var(--amber)', display: 'inline-block' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Forecast</span>
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={daily} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="date" tickFormatter={dateLabel} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name="Sales" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {daily.map((_, i) => <Cell key={i} fill={i === daily.length - 1 ? 'var(--green)' : 'rgba(34,211,165,0.35)'} />)}
            </Bar>
            <Line type="monotone" dataKey="ma" name="Forecast" stroke="var(--amber)" strokeWidth={2} dot={false} strokeDasharray="4 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Top selling */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <TrendingUp size={15} color="var(--green)" />
          <div style={{ fontWeight: 500, fontSize: 14 }}>Top selling products</div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>last 14 days</span>
        </div>
        {topSell.map((p, i) => {
          const pct = Math.round((p.totalSold / maxSold) * 100)
          return (
            <div key={p.productId} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < topSell.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span className="mono" style={{ color: 'var(--text-muted)', minWidth: 24 }}>#{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>{p.productName}</div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--green)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 80 }}>
                <div className="mono" style={{ color: 'var(--green)', fontWeight: 500 }}>{p.totalSold}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>units sold</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{p.currentStock}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>in stock</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}