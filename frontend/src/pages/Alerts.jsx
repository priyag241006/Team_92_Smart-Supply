import { useEffect, useState } from 'react'
import { getAlerts } from '../api/inventory'
import { TrendingDown, Clock, Zap, RefreshCw } from 'lucide-react'

function AlertSection({ title, icon: Icon, color, alerts, renderAlert }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
        <div style={{ fontWeight: 500, fontSize: 13 }}>{title}</div>
        <span style={{ marginLeft: 'auto', background: alerts.length > 0 ? `${color}18` : 'transparent', color: alerts.length > 0 ? color : 'var(--text-muted)', fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
          {alerts.length}
        </span>
      </div>
      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>No active alerts</div>
      ) : (
        alerts.map((a, i) => renderAlert(a, i))
      )}
    </div>
  )
}

export default function Alerts() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getAlerts().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <RefreshCw size={20} color="var(--text-muted)" />
    </div>
  )

  const sc = s => s === 'CRITICAL' ? 'var(--red)' : s === 'WARNING' ? 'var(--amber)' : 'var(--blue)'

  return (
    <div className="page-animate">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-subtitle">Smart alerts — stock, expiry and demand monitoring</div>
        </div>
        <button className="btn" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      <AlertSection
        title="Fast depletion warnings"
        icon={Zap} color="var(--red)"
        alerts={data?.velocity || []}
        renderAlert={(a, i) => (
          <div key={i} className="alert-item" style={{ borderColor: 'rgba(244,63,94,0.15)', background: a.severity === 'CRITICAL' ? 'var(--red-bg)' : 'transparent' }}>
            <div className="alert-dot" style={{ background: sc(a.severity) }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{a.productName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.message}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Stock: <strong style={{ color: 'var(--text-primary)' }}>{a.quantity}</strong></span>
                <span>Selling: <strong style={{ color: 'var(--amber)' }}>{a.velocity}/day</strong></span>
                <span>Runs out: <strong style={{ color: 'var(--red)' }}>~{a.daysToStockout} days</strong></span>
              </div>
            </div>
            <span className="badge" style={{ background: `${sc(a.severity)}18`, color: sc(a.severity) }}>{a.severity}</span>
          </div>
        )}
      />

      <AlertSection
        title="Low stock warnings"
        icon={TrendingDown} color="var(--amber)"
        alerts={data?.lowStock || []}
        renderAlert={(a, i) => (
          <div key={i} className="alert-item" style={{ borderColor: 'rgba(245,158,11,0.15)' }}>
            <div className="alert-dot" style={{ background: sc(a.severity) }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{a.productName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.message}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Stock: <strong style={{ color: 'var(--amber)' }}>{a.quantity}</strong></span>
                <span>Min required: <strong style={{ color: 'var(--text-primary)' }}>{a.threshold}</strong></span>
              </div>
            </div>
            <span className="badge" style={{ background: `${sc(a.severity)}18`, color: sc(a.severity) }}>{a.severity}</span>
          </div>
        )}
      />

      <AlertSection
        title="Expiry warnings"
        icon={Clock} color="var(--blue)"
        alerts={data?.expiry || []}
        renderAlert={(a, i) => (
          <div key={i} className="alert-item" style={{ borderColor: 'rgba(96,165,250,0.15)' }}>
            <div className="alert-dot" style={{ background: a.daysLeft <= 1 ? 'var(--red)' : a.daysLeft <= 3 ? 'var(--amber)' : 'var(--blue)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{a.productName}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.message}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Expires on: <strong style={{ color: 'var(--text-primary)' }}>{a.expiryDate}</strong>
              </div>
            </div>
            <span className="badge badge-blue">{a.daysLeft}d left</span>
          </div>
        )}
      />
    </div>
  )
}