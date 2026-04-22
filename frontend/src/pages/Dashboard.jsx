import { useEffect, useState } from 'react'
import { getDashboard, getProducts, getAlerts, addProduct, deleteProduct, getExpiredLog, clearExpiredLog } from '../api/inventory'
import { TrendingDown, AlertTriangle, Package, IndianRupee, RefreshCw, Plus, Trash2, X, Search, ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react'

function StockBar({ qty, threshold, max }) {
  const pct = Math.min((qty / (max || 1)) * 100, 100)
  const color = qty === 0 ? 'var(--red)' : qty <= threshold ? 'var(--amber)' : 'var(--green)'
  return (
    <div className="stock-bar-wrap">
      <div className="stock-bar-bg">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="mono" style={{ color, minWidth: 36, textAlign: 'right', fontSize: 12, fontWeight: 600 }}>{qty}</span>
    </div>
  )
}

function StockBadge({ qty, threshold }) {
  if (qty === 0)        return <span className="badge badge-red">Out of stock</span>
  if (qty <= threshold) return <span className="badge badge-amber">Low stock</span>
  return                       <span className="badge badge-green">In stock</span>
}

const CATEGORIES = ['Dairy', 'Bakery', 'Grains', 'Snacks', 'Beverages', 'Personal Care', 'Household', 'Essentials']
const emptyForm = { id: '', name: '', category: 'Dairy', quantity: '', threshold: '', price: '', expiryDate: '' }

export default function Dashboard() {
  const [summary,      setSummary]      = useState(null)
  const [products,     setProducts]     = useState([])
  const [alerts,       setAlerts]       = useState({})
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [form,         setForm]         = useState(emptyForm)
  const [formError,    setFormError]    = useState('')
  const [formSuccess,  setFormSuccess]  = useState('')
  const [formLoading,  setFormLoading]  = useState(false)
  const [search,       setSearch]       = useState('')
  const [filterStock,  setFilterStock]  = useState('all')
  const [sortField,    setSortField]    = useState('name')
  const [sortDir,      setSortDir]      = useState('asc')
  const [expiredToast, setExpiredToast] = useState([])

  const refresh = () => {
    Promise.all([getDashboard(), getProducts(), getAlerts(), getExpiredLog()])
      .then(([s, p, a, exp]) => {
        setSummary(s); setProducts(p); setAlerts(a); setLoading(false)
        if (exp && exp.length > 0) setExpiredToast(exp)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30000)
    return () => clearInterval(id)
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    await deleteProduct(id); refresh()
  }

  const handleAddProduct = async () => {
    setFormError(''); setFormSuccess('')
    if (!form.id || !form.name || !form.quantity || !form.threshold || !form.price || !form.expiryDate) {
      setFormError('All fields are required!'); return
    }
    setFormLoading(true)
    try {
      await addProduct({
        id: form.id.toUpperCase(), name: form.name, category: form.category,
        quantity: parseInt(form.quantity), threshold: parseInt(form.threshold),
        price: parseFloat(form.price), expiryDate: form.expiryDate
      })
      setFormSuccess('Product added successfully!')
      setForm(emptyForm); refresh()
      setTimeout(() => { setShowForm(false); setFormSuccess('') }, 1500)
    } catch (e) {
      setFormError(e.response?.data || 'Failed to add product')
    } finally { setFormLoading(false) }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const handleDismissExpired = async () => {
    await clearExpiredLog(); setExpiredToast([])
  }

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase()) ||
                          p.id.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filterStock === 'all'     ? true :
                          filterStock === 'low'     ? p.quantity <= p.threshold && p.quantity > 0 :
                          filterStock === 'out'     ? p.quantity === 0 :
                          p.quantity > p.threshold
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      let valA = sortField === 'quantity' ? a.quantity : sortField === 'price' ? a.price : a.name
      let valB = sortField === 'quantity' ? b.quantity : sortField === 'price' ? b.price : b.name
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase() }
      return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
    })

  const maxQty = products.length ? Math.max(...products.map(p => p.quantity)) : 1

  const SortIcon = ({ field }) => sortField !== field
    ? <ChevronUp size={11} style={{ opacity: 0.3 }} />
    : sortDir === 'asc'
      ? <ChevronUp size={11} color="var(--green)" />
      : <ChevronDown size={11} color="var(--green)" />

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading inventory...</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const criticalAlerts = [
    ...(alerts.velocity || []).filter(a => a.severity === 'CRITICAL'),
    ...(alerts.expiry   || []).filter(a => a.severity === 'CRITICAL'),
    ...(alerts.lowStock || []).filter(a => a.severity === 'CRITICAL'),
  ].slice(0, 3)

  const statCards = [
    { label: 'Total Products',  value: summary?.totalProducts ?? '-',                                          sub: 'in inventory',   color: 'var(--blue)',  bg: 'var(--blue-bg)',  icon: Package       },
    { label: 'Active Alerts',   value: summary?.totalAlerts   ?? '-',                                          sub: 'need attention', color: 'var(--red)',   bg: 'var(--red-bg)',   icon: AlertTriangle },
    { label: 'Low Stock',       value: summary?.lowStockCount ?? '-',                                          sub: 'need reorder',   color: 'var(--amber)', bg: 'var(--amber-bg)', icon: TrendingDown  },
    { label: 'Inventory Value', value: `₹${(summary?.totalValue ?? 0).toLocaleString('en-IN')}`,               sub: 'total worth',    color: 'var(--green)', bg: 'var(--green-bg)', icon: IndianRupee   },
  ]

  return (
    <div className="page-animate">

      {/* Expired toast */}
      {expiredToast.length > 0 && (
        <div className="slide-in" style={{
          background: '#fff', border: '1px solid #fca5a5',
          borderLeft: '4px solid var(--red)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 14,
          boxShadow: '0 4px 16px rgba(239,68,68,0.12)',
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color="var(--red)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 6, fontSize: 14 }}>
              {expiredToast.length} product(s) auto-removed — expired!
            </div>
            {expiredToast.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                • {e.productName} — expired on {e.expiryDate}
              </div>
            ))}
          </div>
          <button onClick={handleDismissExpired} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Live inventory overview — {products.length} products tracked</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={refresh}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormError(''); setFormSuccess('') }}>
            <Plus size={14} /> Add Product
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, sub, color, bg, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={18} color={color} strokeWidth={2} />
            </div>
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-sub">{sub}</div>
            <div className="stat-accent" style={{ background: color }} />
          </div>
        ))}
      </div>

      {/* Add Product Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 200, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div className="slide-in" style={{
            background: '#fff',
            borderRadius: 'var(--radius-xl)',
            padding: '32px 36px',
            width: '100%', maxWidth: 500,
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>Add New Product</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Fill in the product details below</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{
                background: 'var(--bg-base)', border: '1px solid var(--border)',
                borderRadius: 8, cursor: 'pointer', color: 'var(--text-muted)',
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <X size={16} />
              </button>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
              {[
                { label: 'Product ID',   key: 'id',   placeholder: 'e.g. P029' },
                { label: 'Product Name', key: 'name', placeholder: 'e.g. Amul Ice Cream' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input className="input" placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid-2" style={{ gap: 14, marginBottom: 20 }}>
              {[
                { label: 'Stock Quantity',  key: 'quantity',   placeholder: '100',   type: 'number' },
                { label: 'Alert Threshold', key: 'threshold',  placeholder: '20',    type: 'number' },
                { label: 'Price (₹)',       key: 'price',      placeholder: '99.00', type: 'number' },
                { label: 'Expiry Date',     key: 'expiryDate', placeholder: '',      type: 'date'   },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input className="input" type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            {formError && (
              <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 14, padding: '10px 14px', background: 'var(--red-bg)', borderRadius: 8, border: '1px solid #fca5a5' }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ color: 'var(--green-dark)', fontSize: 12, marginBottom: 14, padding: '10px 14px', background: 'var(--green-bg)', borderRadius: 8, border: '1px solid #a7f3d0' }}>
                ✓ {formSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddProduct} disabled={formLoading} style={{ flex: 2 }}>
                <Plus size={14} />
                {formLoading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="card" style={{ marginBottom: 18, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search by name, category or ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 36, background: '#fff' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all',     label: 'All',          count: products.length },
              { key: 'low',     label: 'Low Stock',    count: products.filter(p => p.quantity <= p.threshold && p.quantity > 0).length },
              { key: 'out',     label: 'Out of Stock', count: products.filter(p => p.quantity === 0).length },
              { key: 'healthy', label: 'Healthy',      count: products.filter(p => p.quantity > p.threshold).length },
            ].map(({ key, label, count }) => (
              <button key={key} onClick={() => setFilterStock(key)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: `1.5px solid ${filterStock === key ? 'var(--green)' : 'var(--border)'}`,
                background: filterStock === key ? 'var(--green-bg)' : '#fff',
                color: filterStock === key ? 'var(--green-dark)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                {label}
                <span style={{
                  background: filterStock === key ? 'var(--green)' : 'var(--border)',
                  color: filterStock === key ? '#fff' : 'var(--text-muted)',
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} of {products.length}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={16} color="var(--green)" />
            Inventory
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{filtered.length} products</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Product <SortIcon field="name" /></span>
                </th>
                <th>Category</th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Stock <SortIcon field="quantity" /></span>
                </th>
                <th onClick={() => handleSort('price')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Price <SortIcon field="price" /></span>
                </th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <Package size={32} />
                      <p>No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const daysLeft = Math.ceil((new Date(p.expiryDate) - Date.now()) / 86400000)
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="mono" style={{ color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '2px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
                          {p.id}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td><span className="badge badge-gray">{p.category}</span></td>
                      <td style={{ minWidth: 170 }}>
                        <StockBar qty={p.quantity} threshold={p.threshold} max={maxQty} />
                      </td>
                      <td>
                        <span className="mono" style={{ fontWeight: 600 }}>₹{p.price}</span>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 12,
                          color: daysLeft <= 3 ? 'var(--red)' : daysLeft <= 7 ? 'var(--amber)' : 'var(--text-secondary)',
                          fontWeight: daysLeft <= 7 ? 600 : 400
                        }}>
                          {p.expiryDate}
                          {daysLeft <= 7 && (
                            <span style={{
                              marginLeft: 6, fontSize: 10,
                              background: daysLeft <= 3 ? 'var(--red-bg)' : 'var(--amber-bg)',
                              color: daysLeft <= 3 ? 'var(--red)' : 'var(--amber)',
                              padding: '1px 6px', borderRadius: 4, fontWeight: 600
                            }}>
                              {daysLeft}d
                            </span>
                          )}
                        </span>
                      </td>
                      <td><StockBadge qty={p.quantity} threshold={p.threshold} /></td>
                      <td>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            background: 'var(--red-bg)', border: '1px solid #fca5a5',
                            borderRadius: 7, cursor: 'pointer', color: 'var(--red)',
                            width: 30, height: 30, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.transform = 'scale(1.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical alerts */}
      {criticalAlerts.length > 0 && (
        <div style={{
          background: '#fff', border: '1px solid #fca5a5',
          borderRadius: 'var(--radius-lg)', padding: '20px 24px',
          boxShadow: '0 4px 16px rgba(239,68,68,0.08)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={14} color="var(--red)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--red)' }}>Critical alerts right now</div>
          </div>
          {criticalAlerts.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--red-bg)', border: '1px solid #fca5a5',
              marginBottom: i < criticalAlerts.length - 1 ? 8 : 0
            }}>
              <div className="alert-dot pulse" style={{ background: 'var(--red)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.productName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.message}</div>
              </div>
              <span className="badge badge-red">
                {a.type === 'VELOCITY' ? `~${a.daysToStockout}d left` : a.type}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}