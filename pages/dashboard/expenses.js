import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const CATS = ['مواد خام','رواتب','إيجار','مرافق','صيانة','تسويق','نقل','أخرى']

export default function ExpensesPage({ session }) {
  const router = useRouter()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ cat: 'مواد خام', vendor: '', amount: '', note: '' })
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!session) { router.push('/'); return }
    fetchData('expenses').then(data => { setExpenses(data); setLoading(false) })
  }, [session])

  const save = async () => {
    if (!form.amount || !parseFloat(form.amount)) { alert('أدخل المبلغ'); return }
    const record = { ...form, id: crypto.randomUUID(), date: today, amount: parseFloat(form.amount) }
    const saved = await saveData('expenses', record)
    setExpenses(p => [saved, ...p])
    setForm({ cat: 'مواد خام', vendor: '', amount: '', note: '' })
  }

  const todayExp = expenses.filter(e => e.date === today).reduce((s,e) => s+(e.amount||0), 0)
  const totalExp = expenses.reduce((s,e) => s+(e.amount||0), 0)

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{ padding: '16px' }}>
        <h1 className="page-title">💸 المصروفات</h1>
        <div className="kpi-grid" style={{ marginBottom: '14px' }}>
          <div className="kpi-card red"><div className="kpi-value">{todayExp.toLocaleString()}</div><div className="kpi-label">مصروف اليوم</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{fontSize:'14px',color:'var(--orange)'}}>{totalExp.toLocaleString()}</div><div className="kpi-label">إجمالي السجل</div></div>
        </div>
        <div className="card" style={{ marginBottom: '14px' }}>
          <h3 className="card-title">+ تسجيل مصروف</h3>
          <div className="form-grid">
            <div className="form-group"><label>الفئة</label>
              <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>
                {CATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>المورد / الجهة</label><input type="text" value={form.vendor} onChange={e=>setForm({...form,vendor:e.target.value})} placeholder="اختياري"/></div>
            <div className="form-group"><label>المبلغ (د.ع) *</label><input type="number" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0"/></div>
            <div className="form-group"><label>ملاحظات</label><input type="text" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="اختياري"/></div>
          </div>
          <button className="btn-primary" onClick={save}>💾 حفظ</button>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>التاريخ</th><th>الفئة</th><th>الجهة</th><th>المبلغ</th></tr></thead>
            <tbody>
              {expenses.slice(0,30).map(e=>(
                <tr key={e.id}>
                  <td>{e.date}</td><td>{e.cat}</td><td>{e.vendor||'—'}</td>
                  <td className="bold-gold">{(e.amount||0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
