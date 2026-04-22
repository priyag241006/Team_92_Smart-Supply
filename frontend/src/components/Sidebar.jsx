import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ScanLine, Bell, BarChart2, Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getAlerts } from '../api/inventory'

const links = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/billing',   icon: ScanLine,        label: 'Billing'    },
  { to: '/alerts',    icon: Bell,            label: 'Alerts'     },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics'  },
]

export default function Sidebar() {
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    getAlerts().then(d => setAlertCount(d.totalCount || 0)).catch(() => {})
    const id = setInterval(() => {
      getAlerts().then(d => setAlertCount(d.totalCount || 0)).catch(() => {})
    }, 15000)
    return () => clearInterval(id)
  }, [])

  return (
    <aside style={{
      width: 'var(--sidebar-w)', position: 'fixed', top: 0, left: 0,
      height: '100vh', background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)', display: 'flex',
      flexDirection: 'column', padding: '20px 0', zIndex: 100,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={16} color="#0a0e1a" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.2 }}>StockSense</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SMART INVENTORY</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '16px 10px' }}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 13, fontWeight: 500,
              color: isActive ? 'var(--green)' : 'var(--text-secondary)',
              background: isActive ? 'var(--green-bg)' : 'transparent',
              transition: 'all 0.15s',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
                {label === 'Alerts' && alertCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, lineHeight: 1.6 }}>
                    {alertCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}