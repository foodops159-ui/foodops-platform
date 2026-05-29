import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const HACCP_LEVELS = ['CCP', 'CP', 'GMP']
const HACCP_COLORS = { CCP: '#FF3B5C', CP: '#FFD426', GMP: '#00D46A' }
const CATEGORIES = ['مطبخ', 'بار', 'صالة', 'مستودع', 'حلويات']

export default function CLDPage({ session }) {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [form, setForm] = useState({ name: '', haccp_level: 'CP', min_temp: '', max_temp: '', shelf_life: 3, has_allergen: false, usage: '', category: 'مطبخ' })
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')

  useEffect(() => {
    if (!session) { router.push('/'); return }
    load()
  }, [session])

  const load = async () => {
    const data = await fetchData('cld_items')
    setItems(data.filter(i => i.is_active !== false))
    setLoading(false)
  }

  const save = async () => {
    if (!form.name.trim()) { alert('أدخل اسم الصنف'); return }
    try {
      const record = { ...form, id: editId || crypto.randomUUID(), is_active: true }
      const saved = await saveData('cld_items', record)
      if (editId) {
        setItems(prev => prev.map(i => i.id === editId ? saved : i))
      } else {
        setItems(prev => [saved, ...prev])
      }
      setForm({ name: '', haccp_level: 'CP', min_temp: '', max_temp: '', shelf_life: 3, has_allergen: false, usage: '', category: 'مطبخ' })
      setEditId(null)
      setTab('list')
    } catch (e) { alert('خطأ: ' + e.message) }
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    await saveData('cld_items', { id, is_active: false })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const startEdit = (item) => {
    setForm({ name: item.name, haccp_level: item.haccp_level || 'CP', min_temp: item.min_temp || '', max_temp: item.max_temp || '', shelf_life: item.shelf_life || 3, has_allergen: item.has_allergen || false, usage: item.usage || '', category: item.category || 'مطبخ' })
    setEditId(item.id)
    setTab('add')
  }

  const filtered = items.filter(i =>
    (!search || i.name.includes(search)) &&
    (!filterCat || i.category === filterCat)
  )

  if (loading) return <Layout session={session}><div className="loading-screen"><div className="loading-logo">⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <h1 className="page-title">🔗 جك لاين — Check Line Daily</h1>
          <p style={{ fontSize: '10px', color: 'var(--text)' }}>أصناف التحضير اليومي الخاصة بمطعمك</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
          {[['list', '📋 الأصناف'], ['add', editId ? '✏️ تعديل' : '➕ إضافة']].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); if(id==='list'){setEditId(null);setForm({name:'',haccp_level:'CP',min_temp:'',max_temp:'',shelf_life:3,has_allergen:false,usage:'',category:'مطبخ'})} }}
              style={{ padding: '8px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px', fontWeight: tab === id ? '700' : '400', background: tab === id ? 'rgba(201,168,76,.15)' : 'rgba(255,255,255,.05)', color: tab === id ? 'var(--gold)' : 'var(--text)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab === 'list' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: '120px', padding: '8px 10px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--white)', fontFamily: 'Cairo, sans-serif', fontSize: '12px', outline: 'none' }} />
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{ padding: '8px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--white)', fontFamily: 'Cairo, sans-serif', fontSize: '11px', outline: 'none' }}>
                <option value="">كل الأقسام</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => setTab('add')} className="btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '12px', padding: '8px 14px' }}>+ إضافة</button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {Object.entries({ CCP: 'var(--red)', CP: 'var(--gold)', GMP: 'var(--green)' }).map(([level, color]) => (
                <div key={level} style={{ background: 'var(--card2)', border: `1px solid ${color}33`, borderRadius: '8px', padding: '8px 14px', textAlign: 'center', minWidth: '70px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '900', color }}>{items.filter(i => i.haccp_level === level).length}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text)' }}>{level}</div>
                </div>
              ))}
              <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 14px', textAlign: 'center', minWidth: '70px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '18px', fontWeight: '900', color: 'var(--orange)' }}>{items.filter(i => i.has_allergen).length}</div>
                <div style={{ fontSize: '9px', color: 'var(--text)' }}>⚠️ حساسية</div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '12px' }}>
                لا توجد أصناف — اضغط "+ إضافة" لإضافة أول صنف
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filtered.map(item => (
                  <div key={item.id} style={{ background: 'var(--card2)', border: `1px solid ${item.has_allergen ? 'rgba(255,107,53,.25)' : 'var(--border)'}`, borderRadius: '10px', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '700', fontSize: '13px' }}>{item.name}</span>
                          <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '4px', background: `${HACCP_COLORS[item.haccp_level]}22`, color: HACCP_COLORS[item.haccp_level] || 'var(--text)', fontFamily: 'monospace' }}>{item.haccp_level}</span>
                          {item.has_allergen && <span style={{ fontSize: '9px', color: 'var(--orange)' }}>⚠️ حساسية</span>}
                          <span style={{ fontSize: '9px', color: 'var(--muted)', background: 'rgba(255,255,255,.06)', padding: '1px 6px', borderRadius: '3px' }}>{item.category}</span>
                        </div>
                        {(item.min_temp || item.max_temp) && (
                          <div style={{ fontSize: '10px', color: 'var(--blue)' }}>🌡️ {item.min_temp && item.min_temp} {item.min_temp && item.max_temp && '←'} {item.max_temp && item.max_temp}</div>
                        )}
                        {item.shelf_life > 0 && <div style={{ fontSize: '9px', color: 'var(--text)' }}>📅 صلاحية: {item.shelf_life} يوم</div>}
                        {item.usage && <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '2px' }}>🍽️ {item.usage}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button onClick={() => startEdit(item)}
                          style={{ background: 'rgba(255,212,38,.1)', border: '1px solid rgba(255,212,38,.2)', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', color: 'var(--gold)', fontSize: '12px' }}>✏️</button>
                        <button onClick={() => deleteItem(item.id, item.name)}
                          style={{ background: 'rgba(255,59,92,.1)', border: '1px solid rgba(255,59,92,.2)', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', color: 'var(--red)', fontSize: '12px' }}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD/EDIT FORM */}
        {tab === 'add' && (
          <div className="card">
            <h3 className="card-title">{editId ? '✏️ تعديل الصنف' : '➕ إضافة صنف جديد'}</h3>
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>اسم الصنف *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="مثال: صدور دجاج طازجة" />
              </div>
              <div className="form-group">
                <label>مستوى HACCP</label>
                <select value={form.haccp_level} onChange={e => setForm({ ...form, haccp_level: e.target.value })}>
                  {HACCP_LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>القسم</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>🌡️ درجة الحرارة الدنيا</label>
                <input type="text" value={form.min_temp} onChange={e => setForm({ ...form, min_temp: e.target.value })} placeholder="مثال: ≤4°C" />
              </div>
              <div className="form-group">
                <label>🌡️ درجة الحرارة القصوى</label>
                <input type="text" value={form.max_temp} onChange={e => setForm({ ...form, max_temp: e.target.value })} placeholder="مثال: -18°C" />
              </div>
              <div className="form-group">
                <label>📅 أيام الصلاحية</label>
                <input type="number" value={form.shelf_life} onChange={e => setForm({ ...form, shelf_life: parseInt(e.target.value) || 0 })} min="0" />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                <input type="checkbox" id="allergen-cb" checked={form.has_allergen} onChange={e => setForm({ ...form, has_allergen: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                <label htmlFor="allergen-cb" style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--white)' }}>⚠️ يحتوي على حساسية</label>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>🍽️ يُستخدم في</label>
                <input type="text" value={form.usage} onChange={e => setForm({ ...form, usage: e.target.value })} placeholder="مثال: برغر · شاورما · جينكا" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button className="btn-primary" onClick={save} style={{ flex: 1 }}>
                {editId ? '💾 حفظ التعديل' : '💾 إضافة للجك لاين'}
              </button>
              <button onClick={() => { setTab('list'); setEditId(null) }}
                style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
