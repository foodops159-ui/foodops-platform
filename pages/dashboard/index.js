import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, fetchData } from '../../lib/supabase'
import Layout from '../../components/Layout'

export default function Dashboard({ session }) {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState(null)
  const [revenues, setRevenues] = useState([])
  const [expenses, setExpenses] = useState([])
  const [employees, setEmployees] = useState([])
  const [wmsItems, setWmsItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { router.push('/'); return }
    loadData()
  }, [session])

  const loadData = async () => {
    try {
      const { data: ru } = await supabase
        .from('restaurant_users')
        .select('restaurant_id, restaurants(*)')
        .eq('user_id', session.user.id)
        .single()

      if (!ru?.restaurants?.is_active) {
        await supabase.auth.signOut()
        router.push('/')
        return
      }
      setRestaurant(ru.restaurants)

      const [rev, exp, emp, wms] = await Promise.all([
        fetchData('revenues'),
        fetchData('expenses'),
        fetchData('employees'),
        fetchData('wms_catalog'),
      ])
      setRevenues(rev); setExpenses(exp); setEmployees(emp); setWmsItems(wms)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const today = new Date().toISOString().split('T')[0]
  const todayRev = revenues.filter(r=>r.date===today).reduce((s,r)=>s+(r.total||0),0)
  const todayExp = expenses.filter(e=>e.date===today).reduce((s,e)=>s+(e.amount||0),0)
  const lowStock = wmsItems.filter(i=>(i.stock||0)<=(i.min_stock||5)).length
  const profit = todayRev - todayExp

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-logo">⚡ FOOD OPS</div>
      <div className="loading-sub">جاري التحميل...</div>
    </div>
  )

  return (
    <Layout session={session}>
      <div style={{ padding: '16px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 className="page-title">📊 لوحة المتابعة</h1>
          {restaurant && <div style={{ fontSize: '11px', color: 'var(--gold)' }}>🏪 {restaurant.name}</div>}
        </div>

        <div className="kpi-grid" style={{ marginBottom: '16px' }}>
          <div className="kpi-card green">
            <div className="kpi-value">{todayRev.toLocaleString()}</div>
            <div className="kpi-label">💰 إيراد اليوم (د.ع)</div>
          </div>
          <div className="kpi-card red">
            <div className="kpi-value">{todayExp.toLocaleString()}</div>
            <div className="kpi-label">💸 مصروف اليوم</div>
          </div>
          <div className={`kpi-card ${profit >= 0 ? 'green' : 'red'}`}>
            <div className="kpi-value">{profit.toLocaleString()}</div>
            <div className="kpi-label">📈 صافي اليوم</div>
          </div>
          <div className="kpi-card blue">
            <div className="kpi-value">{employees.length}</div>
            <div className="kpi-label">👥 الموظفون</div>
          </div>
          <div className={`kpi-card ${lowStock > 0 ? 'orange' : 'green'}`}>
            <div className="kpi-value">{lowStock}</div>
            <div className="kpi-label">⚠️ مخزون منخفض</div>
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: '8px' }}>
          {[
            { href:'/dashboard/revenues', icon:'💰', label:'تسجيل إيراد' },
            { href:'/dashboard/expenses', icon:'💸', label:'تسجيل مصروف' },
            { href:'/dashboard/wms',      icon:'📦', label:'المستودع' },
            { href:'/dashboard/cld',      icon:'🔗', label:'جك لاين' },
            { href:'/dashboard/employees',icon:'👥', label:'الموظفون' },
            { href:'/dashboard/haccp',    icon:'🌡️', label:'HACCP' },
          ].map(item => (
            <button key={item.href} onClick={() => router.push(item.href)}
              style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
              onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(201,168,76,.4)'}
              onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{item.icon}</div>
              <div style={{ fontSize: '11px', color: 'var(--text)', fontFamily: 'Cairo, sans-serif' }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )
}
