import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

export default function RevenuesPage({ session }) {
  const router = useRouter()
  const [revenues, setRevenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ shift: 'صباحي', cash: '', pos: '', app: '', customers: '', note: '' })
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!session) { router.push('/'); return }
    fetchData('revenues').then(data => { setRevenues(data); setLoading(false) })
  }, [session])

  const total = (parseFloat(form.cash)||0) + (parseFloat(form.pos)||0) + (parseFloat(form.app)||0)

  const save = async () => {
    if (!total) { alert('أدخل قيمة الإيراد'); return }
    const record = { ...form, id: crypto.randomUUID(), date: today, total, cash: parseFloat(form.cash)||0, pos: parseFloat(form.pos)||0, app: parseFloat(form.app)||0, customers: parseInt(form.customers)||0 }
    const saved = await saveData('revenues', record)
    setRevenues(p => [saved, ...p])
    setForm({ shift: 'صباحي', cash: '', pos: '', app: '', customers: '', note: '' })
  }

  const todayRev = revenues.filter(r => r.date === today).reduce((s, r) => s + (r.total||0), 0)
  const monthRev = revenues.reduce((s, r) => s + (r.total||0), 0)

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{ padding: '16px' }}>
        <h1 className="page-title">💰 الإيرادات</h1>
        <div className="kpi-grid" style={{ marginBottom: '14px' }}>
          <div className="kpi-card green"><div className="kpi-value">{todayRev.toLocaleString()}</div><div className="kpi-label">إيراد اليوم (د.ع)</div></div>
          <div className="kpi-card blue"><div className="kpi-value">{revenues.filter(r=>r.date===today).length}</div><div className="kpi-label">عدد الشفتات</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{fontSize:'14px',color:'var(--gold)'}}>{monthRev.toLocaleString()}</div><div className="kpi-label">إجمالي السجل</div></div>
        </div>
        <div className="card" style={{ marginBottom: '14px' }}>
          <h3 className="card-title">+ تسجيل إيراد</h3>
          <div className="form-grid">
            <div className="form-group"><label>الشفت</label>
              <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})}>
                <option>صباحي</option><option>مسائي</option><option>ليلي</option>
              </select>
            </div>
            <div className="form-group"><label>نقدي (د.ع)</label><input type="number" value={form.cash} onChange={e=>setForm({...form,cash:e.target.value})} placeholder="0"/></div>
            <div className="form-group"><label>POS</label><input type="number" value={form.pos} onChange={e=>setForm({...form,pos:e.target.value})} placeholder="0"/></div>
            <div className="form-group"><label>تطبيق توصيل</label><input type="number" value={form.app} onChange={e=>setForm({...form,app:e.target.value})} placeholder="0"/></div>
            <div className="form-group"><label>عدد الزبائن</label><input type="number" value={form.customers} onChange={e=>setForm({...form,customers:e.target.value})} placeholder="0"/></div>
            <div className="form-group"><label>ملاحظات</label><input type="text" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="اختياري"/></div>
          </div>
          <div className="total-bar">الإجمالي: {total.toLocaleString()} د.ع</div>
          <button className="btn-primary" onClick={save}>💾 حفظ</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>التاريخ</th><th>الشفت</th><th>نقدي</th><th>POS</th><th>توصيل</th><th>الإجمالي</th></tr></thead>
            <tbody>
              {revenues.slice(0,30).map(r=>(
                <tr key={r.id}>
                  <td>{r.date}</td><td>{r.shift}</td>
                  <td>{(r.cash||0).toLocaleString()}</td>
                  <td>{(r.pos||0).toLocaleString()}</td>
                  <td>{(r.app||0).toLocaleString()}</td>
                  <td className="bold-gold">{(r.total||0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
