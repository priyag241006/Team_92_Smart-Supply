import { useState, useEffect } from 'react'
import { processSale, undoSale, getSaleHistory, getProducts } from '../api/inventory'
import { ScanLine, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'

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

  return (
    <div className="page-animate">
      <div className="page-header">
        <div className="page-title">Billing</div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="section-label">New sale</div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Product</label>
            <select className="input" value={productId} onChange={e => setProductId(e.target.value)}>
              <option value="">— Select product —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} · {p.name} (stock: {p.quantity})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Quantity</label>
            <input
              type="number"
              className="input"
              min={1}
              value={qty}
              onChange={e => setQty(parseInt(e.target.value) || 1)}
            />
          </div>

          {selectedProduct && (
            <div style={{ background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>{selectedProduct.name}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>
                  Stock:{' '}
                  <span style={{ color: selectedProduct.quantity <= selectedProduct.threshold ? 'var(--amber)' : 'var(--green)', fontWeight: 500 }}>
                    {selectedProduct.quantity}
                  </span>
                </span>
                <span>
                  Price:{' '}
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    ₹{selectedProduct.price}
                  </span>
                </span>
                <span>
                  Total:{' '}
                  <span style={{ color: 'var(--green)', fontWeight: 500 }}>
                    ₹{(selectedProduct.price * qty).toFixed(2)}
                  </span>
                </span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSell} disabled={loading || !productId} style={{ flex: 1 }}>
              <ScanLine size={14} /> {loading ? 'Processing...' : 'Confirm Sale'}
            </button>

            <button className="btn btn-danger" onClick={handleUndo} disabled={loading || history.length === 0}>
              <RotateCcw size={14} /> Undo
            </button>
          </div>

          {result && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              borderRadius: 8,
              background: result.ok ? 'var(--green-bg)' : 'var(--red-bg)',
              border: `1px solid ${result.ok ? 'rgba(34,211,165,0.2)' : 'rgba(244,63,94,0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: result.ok ? 'var(--green)' : 'var(--red)'
            }}>
              {result.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {result.msg}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>
              Recent transactions
            </div>
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <Clock size={24} style={{ marginBottom: 8, opacity: 0.4 }} />
              <div>No transactions yet</div>
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {history.map((r, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{r.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {new Date(r.timestamp).toLocaleTimeString()}
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