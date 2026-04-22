import { useEffect, useState } from 'react'
import { getDashboard, getProducts, getAlerts, addProduct, deleteProduct, getExpiredLog, clearExpiredLog } from '../api/inventory'
import { TrendingDown, AlertTriangle, Package, DollarSign, RefreshCw, Plus, Trash2, X, Search, ChevronUp, ChevronDown } from 'lucide-react'

function StockBar({ qty, threshold, max }) {
  const pct = Math.min((qty / (max || 1)) * 100, 100)
  const color = qty === 0 ? 'var(--red)' : qty <= threshold ? 'var(--amber)' : 'var(--green)'
  return (
    <div className="stock-bar-wrap">
      <div className="stock-bar-bg">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="mono" style={{ color, minWidth: 32, textAlign: 'right' }}>{qty}</span>
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
        setSummary(s)
        setProducts(p)
        setAlerts(a)
        setLoading(false)
        if (exp && exp.length > 0) {
          setExpiredToast(exp)
        }
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
    await deleteProduct(id)
    refresh()
  }

  const handleAddProduct = async () => {
    setFormError('')
    setFormSuccess('')
    if (!form.id || !form.name || !form.quantity || !form.threshold || !form.price || !form.expiryDate) {
      setFormError('All fields are required!')
      return
    }
    setFormLoading(true)
    try {
      await addProduct({
        id:         form.id.toUpperCase(),
        name:       form.name,
        category:   form.category,
        quantity:   parseInt(form.quantity),
        threshold:  parseInt(form.threshold),
        price:      parseFloat(form.price),
        expiryDate: form.expiryDate
      })
      setFormSuccess('Product added successfully!')
      setForm(emptyForm)
      refresh()
      setTimeout(() => { setShowForm(false); setFormSuccess('') }, 1500)
    } catch (e) {
      setFormError(e.response?.data || 'Failed to add product')
    } finally {
      setFormLoading(false)
    }
  }

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const handleDismissExpired = async () => {
    await clearExpiredLog()
    setExpiredToast([])
  }

  // Filter + Search + Sort
  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase()) ||
                          p.id.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filterStock === 'all' ? true :
                          filterStock === 'low'  ? p.quantity <= p.threshold :
                          filterStock === 'out'  ? p.quantity === 0 :
                          p.quantity > p.threshold
      return matchSearch && matchFilter
    })
    .sort((a, b) => {
      let valA = sortField === 'quantity' ? a.quantity : sortField === 'price' ? a.price : a.name
      let valB = sortField === 'quantity' ? b.quantity : sortField === 'price' ? b.price : b.name
      if (typeof valA === 'string') valA = valA.toLowerCase()
      if (typeof valB === 'string') valB = valB.toLowerCase()
      return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1)
    })

  const maxQty = products.length ? Math.max(...products.map(p => p.quantity)) : 1

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronUp size={11} style={{ opacity: 0.3 }} />
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <RefreshCw size={20} color="var(--text-muted)" />
    </div>
  )

  const criticalAlerts = [
    ...(alerts.velocity || []).filter(a => a.severity === 'CRITICAL'),
    ...(alerts.expiry   || []).filter(a => a.severity === 'CRITICAL'),
    ...(alerts.lowStock || []).filter(a => a.severity === 'CRITICAL'),
  ].slice(0, 3)

  return (
    <div className="page-animate">

      {/* Expired product toast notification */}
      {expiredToast.length > 0 && (
        <div style={{
          background: 'var(--red-bg)', border: '1px solid rgba(244,63,94,0.3)',
          borderRadius: 'var(--radius-lg)', padding: '14px 18px',
          marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--red)', marginBottom: 6, fontSize: 13 }}>
              ⚠️ {expiredToast.length} product(s) auto-removed — expired!
            </div>
            {expiredToast.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                • {e.productName} (expired: {e.expiryDate})
              </div>
            ))}
          </div>
          <button onClick={handleDismissExpired} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Live inventory overview — {products.length} products</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={refresh}><RefreshCw size={13} /> Refresh</button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setFormError(''); setFormSuccess('') }}>
            <Plus size={13} /> Add Product
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {[
          { label: 'Total Products', value: summary?.totalProducts ?? '-', sub: 'in inventory',    color: 'var(--blue)',  icon: Package       },
          { label: 'Total Alerts',   value: summary?.totalAlerts   ?? '-', sub: '3 alert types',  color: 'var(--red)',   icon: AlertTriangle },
          { label: 'Low Stock',      value: summary?.lowStockCount ?? '-', sub: 'need reorder',   color: 'var(--amber)', icon: TrendingDown  },
          { label: 'Inventory Value',value: `₹${(summary?.totalValue ?? 0).toLocaleString('en-IN')}`, sub: 'total value', color: 'var(--green)', icon: DollarSign },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div className="stat-accent" style={{ background: color }} />
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>{value}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>

      {/* Add Product Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px 32px',
            width: '100%', maxWidth: 480
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Add New Product</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Product ID', key: 'id', placeholder: 'e.g. P029' },
                { label: 'Product Name', key: 'name', placeholder: 'e.g. Amul Ice Cream' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input className="input" placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Category</label>
              <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid-2" style={{ gap: 12, marginBottom: 12 }}>
              {[
                { label: 'Stock Quantity', key: 'quantity', placeholder: '100', type: 'number' },
                { label: 'Alert Threshold', key: 'threshold', placeholder: '20', type: 'number' },
                { label: 'Price (₹)', key: 'price', placeholder: '99.00', type: 'number' },
                { label: 'Expiry Date', key: 'expiryDate', placeholder: '', type: 'date' },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input className="input" type={type} placeholder={placeholder} value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            {formError && (
              <div style={{ color: 'var(--red)', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'var(--red-bg)', borderRadius: 8 }}>
                {formError}
              </div>
            )}
            {formSuccess && (
              <div style={{ color: 'var(--green)', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'var(--green-bg)', borderRadius: 8 }}>
                {formSuccess}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn" onClick={() => setShowForm(false)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddProduct} disabled={formLoading} style={{ flex: 1 }}>
                {formLoading ? 'Adding...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>

          {/* Search */}
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input" placeholder="Search by name, category or ID..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }} />
          </div>

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'all',    label: 'All' },
              { key: 'low',    label: 'Low Stock' },
              { key: 'out',    label: 'Out of Stock' },
              { key: 'healthy',label: 'Healthy' },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setFilterStock(key)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: `1px solid ${filterStock === key ? 'var(--green)' : 'var(--border)'}`,
                  background: filterStock === key ? 'var(--green-bg)' : 'transparent',
                  color: filterStock === key ? 'var(--green)' : 'var(--text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s'
                }}>
                {label}
              </button>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {filtered.length} of {products.length}
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card" style={{ marginBottom: 24 }}>
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
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const daysLeft = Math.ceil((new Date(p.expiryDate) - Date.now()) / 86400000)
                  return (
                    <tr key={p.id}>
                      <td><span className="mono" style={{ color: 'var(--text-muted)' }}>{p.id}</span></td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td><span className="badge badge-gray">{p.category}</span></td>
                      <td style={{ minWidth: 160 }}><StockBar qty={p.quantity} threshold={p.threshold} max={maxQty} /></td>
                      <td className="mono">₹{p.price}</td>
                      <td style={{ color: daysLeft <= 3 ? 'var(--red)' : daysLeft <= 7 ? 'var(--amber)' : 'var(--text-secondary)', fontSize: 12 }}>
                        {p.expiryDate} {daysLeft <= 7 && <span style={{ fontSize: 10 }}>({daysLeft}d)</span>}
                      </td>
                      <td><StockBadge qty={p.quantity} threshold={p.threshold} /></td>
                      <td>
                        <button onClick={() => handleDelete(p.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'all 0.15s' }}
                          onMouseEnter={e => e.target.style.color = 'var(--red)'}
                          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
                          <Trash2 size={14} />
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
        <div className="card" style={{ borderColor: 'rgba(244,63,94,0.2)' }}>
          <div className="section-label" style={{ color: 'var(--red)', marginBottom: 12 }}>Critical alerts</div>
          {criticalAlerts.map((a, i) => (
            <div key={i} className="alert-item" style={{ borderColor: 'rgba(244,63,94,0.15)', background: 'var(--red-bg)' }}>
              <div className="alert-dot pulse" style={{ background: 'var(--red)' }} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{a.productName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.message}</div>
              </div>
              <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
                {a.type === 'VELOCITY' ? `~${a.daysToStockout}d left` : a.type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}