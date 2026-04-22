import { useState, useEffect } from 'react'
import { processSale, undoSale, getSaleHistory, getProducts } from '../api/inventory'
import { ScanLine, RotateCcw, CheckCircle, XCircle, Clock, ShoppingBag, IndianRupee } from 'lucide-react'

export default function Billing() {
  const [productId, setProductId] = useState('')
  const [qty,       setQty]       = useState(1)
  const [products,  setProducts]  = useState([])
  const [history,   setHistory]   = useState([])
  const [result,    setResult]    = useState(null)
  const [loading,   setLoading]   = useState(false)

  const loadData = () => {
    getProducts().then(setProducts)
    getSaleHistory().then(setHistory)
  }

  useEffect(() => { loadData() }, [])

  const selectedProduct = products.find(p => p.id === productId)

  const handleSell = async () => {
    if (!productId || qty < 1) return
    setLoading(true); setResult(null)
    try {
      const res = await processSale(productId, qty)
      setResult({ ok: true, msg: res.message })
      loadData(); setQty(1)
    } catch (e) {
      setResult({ ok: false, msg: e.response?.data?.message || 'Sale failed' })
    } finally { setLoading(false) }
  }

  const handleUndo = async () => {
    setLoading(true)
    try {
      const res = await undoSale()
      setResult({ ok: true, msg: res.message })
      loadData()
    } catch (e) {
      setResult({ ok: false, msg: e.response?.data?.message || 'Nothing to undo' })
    } finally { setLoading(false) }
  }

  const totalPrice = selectedProduct ? (selectedProduct.price * qty).toFixed(2) : '0.00'

  return (
    <div className="page-animate">
      <div className="page-header">
        <div className="page-title">Billing</div>
        <div className="page-subtitle">Process sales in real-time · Undo last transaction instantly</div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>

        {/* Left — Sale form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Product selector */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanLine size={15} color="var(--green)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>New Sale</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Select Product
              </label>
              <select className="input" value={productId} onChange={e => { setProductId(e.target.value); setResult(null) }}
                style={{ background: '#fff' }}>
                <option value="">— Choose a product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.id} · {p.name} (stock: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Quantity
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                  width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border)',
                  background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 600,
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>−</button>
                <input type="number" className="input" min={1} value={qty}
                  onChange={e => setQty(parseInt(e.target.value) || 1)}
                  style={{ textAlign: 'center', fontWeight: 600, fontSize: 16, background: '#fff' }} />
                <button onClick={() => setQty(q => q + 1)} style={{
                  width: 36, height: 36, borderRadius: 8, border: '1.5px solid var(--border)',
                  background: '#fff', cursor: 'pointer', fontSize: 18, fontWeight: 600,
                  color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>+</button>
              </div>
            </div>

            {/* Product preview card */}
            {selectedProduct ? (
              <div style={{
                background: 'var(--bg-base)', borderRadius: 10,
                border: '1.5px solid var(--border)', padding: '14px 16px', marginBottom: 18,
              }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>{selectedProduct.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'In Stock', value: selectedProduct.quantity, color: selectedProduct.quantity <= selectedProduct.threshold ? 'var(--amber)' : 'var(--green)' },
                    { label: 'Unit Price', value: `₹${selectedProduct.price}`, color: 'var(--text-primary)' },
                    { label: 'Total', value: `₹${totalPrice}`, color: 'var(--green)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'var(--bg-base)', borderRadius: 10,
                border: '1.5px dashed var(--border)', padding: '24px',
                marginBottom: 18, textAlign: 'center',
                color: 'var(--text-muted)', fontSize: 13,
              }}>
                Select a product to see details
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSell}
                disabled={loading || !productId}
                style={{ flex: 1, justifyContent: 'center', padding: '11px 0' }}>
                <ScanLine size={15} />
                {loading ? 'Processing...' : 'Confirm Sale'}
              </button>
              <button className="btn btn-danger" onClick={handleUndo}
                disabled={loading || history.length === 0}
                style={{ padding: '11px 16px' }}>
                <RotateCcw size={14} />
                Undo
              </button>
            </div>

            {/* Result message */}
            {result && (
              <div style={{
                marginTop: 14, padding: '12px 16px', borderRadius: 10,
                background: result.ok ? 'var(--green-bg)' : 'var(--red-bg)',
                border: `1px solid ${result.ok ? '#a7f3d0' : '#fca5a5'}`,
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: 500,
                color: result.ok ? 'var(--green-dark)' : 'var(--red)',
              }}>
                {result.ok
                  ? <CheckCircle size={16} color="var(--green)" />
                  : <XCircle size={16} color="var(--red)" />
                }
                {result.msg}
              </div>
            )}
          </div>
        </div>

        {/* Right — Transaction history */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={14} color="var(--blue)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Recent Transactions</div>
            <span style={{ marginLeft: 'auto', background: 'var(--bg-base)', border: '1px solid var(--border)', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, color: 'var(--text-muted)' }}>
              {history.length}
            </span>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <ShoppingBag size={22} color="var(--text-muted)" />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No transactions yet</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, opacity: 0.7 }}>Sales will appear here</div>
            </div>
          ) : (
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {history.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '13px 22px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.12s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--green-bg)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <ShoppingBag size={15} color="var(--green)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.productName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                      {new Date(r.timestamp).toLocaleTimeString()} · {new Date(r.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="badge badge-blue">−{r.qtySold} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}