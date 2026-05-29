import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const UNITS = ['كغ', 'غم', 'لتر', 'مل', 'حبة', 'علبة', 'كرتون', 'كيس', 'وحدة']
const CATEGORIES = ['لحوم ودجاج', 'أسماك', 'خضروات وفواكه', 'ألبان وجبن', 'صلصات وتوابل', 'عجائن وخبز', 'حلويات', 'مشروبات', 'مواد تنظيف', 'أخرى']

export default function WMSPage({ session }) {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [form, setForm] = useState({ name: '', unit: 'كغ', stock: 0, min_stock: 5, cost: 0, category: 'خضروات وفواكه', expiry_date: '' })
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showLowOnly, setShowLowOnly] = useState(false)

  useEffect(() => {
    if (!session) { router.push('/'); return }
    load()
  }, [session])

  const load = async () => {
    const data = await fetchData('wms_catalog')
    setItems(data.filter(i => i.is_active !== false))
    setLoading(false)
  }

  const save = async () => {
    if (!form.name.trim()) { alert('أدخل اسم الصنف'); return }
    try {
      const record = { ...form, stock: parseFloat(form.stock) || 0, min_stock: parseFloat(form.min_stock) || 5, cost: parseFloat(form.cost) || 0, id: editId || crypto.randomUUID(), is_active: true }
      const saved = await saveData('wms_catalog', record)
      if (editId) {
        setItems(prev => prev.map(i => i.id === editId ? saved : i))
      } else {
        setItems(prev => [saved, ...prev])
      }
      resetForm()
      setTab('list')
    } catch (e) { alert('خطأ: ' + e.message) }
  }

  const updateStock = async (id, delta) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    const newStock = Math.max(0, (parseFloat(item.stock) || 0) + delta)
    const saved = await saveData('wms_catalog', { ...item, stock: newStock })
    setItems(prev => prev.map(i => i.id === id ? { ...i, stock: newStock } : i))
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    await saveData('wms_catalog', { id, is_active: false })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const startEdit = (item) => {
    setForm({ name: item.name, unit: item.unit || 'كغ', stock: item.stock || 0, min_stock: item.min_stock || 5, cost: item.cost || 0, category: item.category || 'أخرى', expiry_date: item.expiry_date || '' })
    setEditId(item.id)
    setTab('add')
  }

  const resetForm = () => {
    setForm({ name: '', unit: 'كغ', stock: 0, min_stock: 5, cost: 0, category: 'خضروات وفواكه', expiry_date: '' })
    setEditId(null)
  }

  const filtered = items.filter(i => {
    const matchSearch = !search || i.name.includes(search)
    const matchCat = !filterCat || i.category === filterCat
    const matchLow = !showLowOnly || (parseFloat(i.stock) || 0) <= (parseFloat(i.min_stock) || 5)
    return matchSearch && matchCat && matchLow
  })

  const lowStockCount = items.filter(i => (parseFloat(i.stock) || 0) <= (parseFloat(i.min_stock) || 5)).length
  const totalValue = items.reduce((s, i) => s + (parseFloat(i.stock) || 0) * (parseFloat(i.cost) || 0), 0)

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{ padding: '16px' }}>
        <h1 className="page-title">📦 كتالوج المستودع</h1>

        {/* Stats */}
        <div className="kpi-grid" style={{ marginBottom: '14px' }}>
          <div className="kpi-card blue">
            <div className="kpi-value">{items.length}</div>
            <div className="kpi-label">إجمالي الأصناف</div>
          </div>
          <div className={`kpi-card ${lowStockCount > 0 ? 'red' : 'green'}`}>
            <div className="kpi-value">{lowStockCount}</div>
            <div className="kpi-label">⚠️ منخفض المخزون</div>
          </div>
          <div className="kpi-card" style={{ background: 'var(--card2)', border: '1px solid var(--border)' }}>
            <div className="kpi-value" style={{ fontSize: '14px', color: 'var(--gold)' }}>{totalValue.toLocaleString()}</div>
            <div className="kpi-label">قيمة المخزون (د.ع)</div>
          </div>
        </div>

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <div className="alert-warning" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ {lowStockCount} أصناف وصلت للحد الأدنى</span>
            <button onClick={() => setShowLowOnly(!showLowOnly)}
              style={{ background: 'rgba(255,212,38,.2)', border: 'none', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '10px', color: 'var(--gold)' }}>
              {showLowOnly ? 'عرض الكل' : 'عرض المنخفض فقط'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {[['list', '📋 المخزون'], ['add', editId ? '✏️ تعديل' : '➕ إضافة']].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); if (id === 'list') resetForm() }}
              style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px', fontWeight: tab === id ? '700' : '400', background: tab === id ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.05)', color: tab === id ? 'var(--gold)' : 'var(--text)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab === 'list' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: '120px', padding: '8px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--white)', fontFamily: 'Cairo, sans-serif', outline: 'none' }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{ padding: '8px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--white)', fontFamily: 'Cairo, sans-serif', outline: 'none' }}>
                <option value="">كل الفئات</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => setTab('add')} className="btn-primary" style={{ fontSize: '12px', padding: '8px 14px' }}>+ إضافة</button>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '12px' }}>لا توجد أصناف</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الصنف</th>
                      <th>الفئة</th>
                      <th>المخزون</th>
                      <th>الحد الأدنى</th>
                      <th>الحالة</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => {
                      const stock = parseFloat(item.stock) || 0
                      const min = parseFloat(item.min_stock) || 5
                      const low = stock <= min
                      return (
                        <tr key={item.id} className={low ? 'row-warning' : ''}>
                          <td>
                            <div style={{ fontWeight: '700' }}>{item.name}</div>
                            {item.expiry_date && <div style={{ fontSize: '9px', color: 'var(--muted)' }}>انتهاء: {item.expiry_date}</div>}
                          </td>
                          <td style={{ fontSize: '10px', color: 'var(--text)' }}>{item.category}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <button onClick={() => updateStock(item.id, -1)}
                                style={{ background: 'rgba(255,59,92,.15)', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', color: 'var(--red)', fontWeight: 'bold' }}>−</button>
                              <span style={{ fontFamily: 'monospace', fontWeight: '700', color: low ? 'var(--red)' : 'var(--white)', minWidth: '40px', textAlign: 'center' }}>{stock} {item.unit}</span>
                              <button onClick={() => updateStock(item.id, 1)}
                                style={{ background: 'rgba(0,212,106,.15)', border: 'none', borderRadius: '4px', width: '22px', height: '22px', cursor: 'pointer', color: 'var(--green)', fontWeight: 'bold' }}>+</button>
                            </div>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '11px' }}>{min} {item.unit}</td>
                          <td>{low ? <span style={{ color: 'var(--red)', fontSize: '10px' }}>⚠️ منخفض</span> : <span style={{ color: 'var(--green)', fontSize: '10px' }}>✅ كافٍ</span>}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button onClick={() => startEdit(item)}
                                style={{ background: 'rgba(255,212,38,.1)', border: '1px solid rgba(255,212,38,.2)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--gold)', fontSize: '11px' }}>✏️</button>
                              <button onClick={() => deleteItem(item.id, item.name)}
                                style={{ background: 'rgba(255,59,92,.1)', border: '1px solid rgba(255,59,92,.2)', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', color: 'var(--red)', fontSize: '11px' }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADD/EDIT */}
        {tab === 'add' && (
          <div className="card">
            <h3 className="card-title">{editId ? '✏️ تعديل الصنف' : '➕ إضافة صنف للمستودع'}</h3>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>اسم الصنف *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: دجاج طازج" />
              </div>
              <div className="form-group">
                <label>الفئة</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>الوحدة</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>الكمية الحالية</label>
                <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>الحد الأدنى للتنبيه</label>
                <input type="number" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>التكلفة (د.ع للوحدة)</label>
                <input type="number" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} min="0" />
              </div>
              <div className="form-group">
                <label>تاريخ انتهاء الصلاحية</label>
                <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button className="btn-primary" onClick={save} style={{ flex: 1 }}>{editId ? '💾 حفظ' : '💾 إضافة'}</button>
              <button onClick={() => { setTab('list'); resetForm() }}
                style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
