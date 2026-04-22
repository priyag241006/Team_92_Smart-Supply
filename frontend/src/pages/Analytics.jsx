import { useEffect, useState } from 'react'
import { getAlerts } from '../api/inventory'
import { TrendingDown, Clock, Zap, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

function AlertSection({ title, subtitle, icon: Icon, color, bg, alerts, renderAlert }) {
  return (
    <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{
        padding: '18px 24px 14px',
        borderBottom: alerts.length > 0 ? '1px solid var(--border)' : 'none',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={17} color={color} strokeWidth={2.5} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>
        </div>
        <div style={{
          background: alerts.length > 0 ? bg : 'var(--bg-base)',
          color: alerts.length > 0 ? color : 'var(--text-muted)',
          fontSize: 13, fontWeight: 700,
          padding: '4px 14px', borderRadius: 20,
          border: `1px solid ${alerts.length > 0 ? color + '40' : 'var(--border)'}`,
          minWidth: 36, textAlign: 'center',
        }}>
          {alerts.length}
        </div>
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div style={{ padding: '28px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={16} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>All clear!</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>No active alerts in this category</div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '12px 16px' }}>
          {alerts.map((a, i) => renderAlert(a, i))}
        </div>
      )}
    </div>
  )
}

export default function Alerts() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getAlerts()
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading alerts...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const sc = s => s === 'CRITICAL' ? 'var(--red)' : s === 'WARNING' ? 'var(--amber)' : 'var(--blue)'
  const scBg = s => s === 'CRITICAL' ? 'var(--red-bg)' : s === 'WARNING' ? 'var(--amber-bg)' : 'var(--blue-bg)'

  const totalAlerts = (data?.velocity?.length || 0) + (data?.lowStock?.length || 0) + (data?.expiry?.length || 0)

  return (
    <div className="page-animate">

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Alerts</div>
          <div className="page-subtitle">
            Smart monitoring — stock levels, expiry dates and demand velocity
          </div>
        </div>
        <button className="btn" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14, marginBottom: 24,
      }}>
        {[
          { label: 'Fast Depletion', count: data?.velocity?.length || 0, color: 'var(--red)',   bg: 'var(--red-bg)',   icon: Zap        },
          { label: 'Low Stock',      count: data?.lowStock?.length  || 0, color: 'var(--amber)', bg: 'var(--amber-bg)', icon: TrendingDown},
          { label: 'Expiry',         count: data?.expiry?.length    || 0, color: 'var(--blue)',  bg: 'var(--blue-bg)',  icon: Clock      },
        ].map(({ label, count, color, bg, icon: Icon }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: 'var(--radius-lg)',
            border: `1px solid ${count > 0 ? color + '30' : 'var(--border)'}`,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: count > 0 ? `0 2px 12px ${color}15` : 'var(--shadow-sm)',
            transition: 'all 0.2s',
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={19} color={color} strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: count > 0 ? color : 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                {count}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* All clear banner */}
      {totalAlerts === 0 && (
        <div style={{
          background: 'var(--green-bg)', border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24,
          boxShadow: '0 2px 12px rgba(16,185,129,0.1)',
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}>
            <CheckCircle size={20} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--green-dark)' }}>Everything looks great!</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>No active alerts — inventory is healthy</div>
          </div>
        </div>
      )}

      {/* Velocity alerts */}
      <AlertSection
        title="Fast Depletion Warnings"
        subtitle="Products selling fast and predicted to run out soon"
        icon={Zap} color="var(--red)" bg="var(--red-bg)"
        alerts={data?.velocity || []}
        renderAlert={(a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 16px', borderRadius: 10, marginBottom: 8,
            background: a.severity === 'CRITICAL' ? 'var(--red-bg)' : '#fff',
            border: `1px solid ${a.severity === 'CRITICAL' ? '#fca5a5' : 'var(--border)'}`,
            boxShadow: a.severity === 'CRITICAL' ? '0 2px 8px rgba(239,68,68,0.08)' : 'none',
            transition: 'all 0.15s',
          }}>
            <div style={{ paddingTop: 2 }}>
              <div className={a.severity === 'CRITICAL' ? 'alert-dot pulse' : 'alert-dot'}
                style={{ background: sc(a.severity) }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.productName}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: scBg(a.severity), color: sc(a.severity),
                  border: `1px solid ${sc(a.severity)}40`,
                }}>
                  {a.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{a.message}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { label: 'Current Stock', value: a.quantity, color: 'var(--text-primary)' },
                  { label: 'Selling Rate',  value: `${a.velocity}/day`, color: 'var(--amber)' },
                  { label: 'Runs Out In',   value: `~${a.daysToStockout} days`, color: 'var(--red)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      />

      {/* Low stock alerts */}
      <AlertSection
        title="Low Stock Warnings"
        subtitle="Products below minimum threshold — reorder recommended"
        icon={TrendingDown} color="var(--amber)" bg="var(--amber-bg)"
        alerts={data?.lowStock || []}
        renderAlert={(a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 16px', borderRadius: 10, marginBottom: 8,
            background: a.severity === 'CRITICAL' ? 'var(--amber-bg)' : '#fff',
            border: `1px solid ${a.severity === 'CRITICAL' ? '#fcd34d' : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ paddingTop: 2 }}>
              <div className="alert-dot" style={{ background: sc(a.severity) }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.productName}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: scBg(a.severity), color: sc(a.severity),
                  border: `1px solid ${sc(a.severity)}40`,
                }}>
                  {a.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{a.message}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Current Stock',  value: a.quantity,  color: 'var(--amber)' },
                  { label: 'Min Required',   value: a.threshold, color: 'var(--text-primary)' },
                  { label: 'Deficit',        value: Math.max(0, a.threshold - a.quantity), color: 'var(--red)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      />

      {/* Expiry alerts */}
      <AlertSection
        title="Expiry Warnings"
        subtitle="Products expiring soon — discount or promote to reduce waste"
        icon={Clock} color="var(--blue)" bg="var(--blue-bg)"
        alerts={data?.expiry || []}
        renderAlert={(a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            padding: '14px 16px', borderRadius: 10, marginBottom: 8,
            background: a.daysLeft <= 1 ? 'var(--red-bg)' : '#fff',
            border: `1px solid ${a.daysLeft <= 1 ? '#fca5a5' : a.daysLeft <= 3 ? '#fcd34d' : 'var(--border)'}`,
            transition: 'all 0.15s',
          }}>
            <div style={{ paddingTop: 2 }}>
              <div className={a.daysLeft <= 1 ? 'alert-dot pulse' : 'alert-dot'} style={{
                background: a.daysLeft <= 1 ? 'var(--red)' : a.daysLeft <= 3 ? 'var(--amber)' : 'var(--blue)'
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{a.productName}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                  background: a.daysLeft <= 1 ? 'var(--red-bg)' : a.daysLeft <= 3 ? 'var(--amber-bg)' : 'var(--blue-bg)',
                  color: a.daysLeft <= 1 ? 'var(--red)' : a.daysLeft <= 3 ? 'var(--amber)' : 'var(--blue)',
                  border: `1px solid ${a.daysLeft <= 1 ? '#fca5a5' : a.daysLeft <= 3 ? '#fcd34d' : '#bfdbfe'}`,
                }}>
                  {a.severity}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{a.message}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'Expiry Date', value: a.expiryDate,  color: 'var(--text-primary)' },
                  { label: 'Days Left',   value: `${a.daysLeft}d`, color: a.daysLeft <= 1 ? 'var(--red)' : a.daysLeft <= 3 ? 'var(--amber)' : 'var(--blue)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: 'var(--bg-base)', borderRadius: 8, padding: '6px 12px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}