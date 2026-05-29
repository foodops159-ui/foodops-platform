import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchData } from '../../lib/supabase'
import Layout from '../../components/Layout'

export default function ReportsPage({ session }) {
  const router = useRouter()
  const [revenues, setRevenues] = useState([])
  const [expenses, setExpenses] = useState([])
  const [employees, setEmployees] = useState([])
  const [wms, setWms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { router.push('/'); return }
    Promise.all([fetchData('revenues'),fetchData('expenses'),fetchData('employees'),fetchData('wms_catalog')]).then(([r,e,emp,w])=>{
      setRevenues(r); setExpenses(e); setEmployees(emp); setWms(w); setLoading(false)
    })
  }, [session])

  const today = new Date().toISOString().split('T')[0]
  const thisMonth = new Date()
  const monthRevs = revenues.filter(r=>{ const d=new Date(r.date); return d.getMonth()===thisMonth.getMonth()&&d.getFullYear()===thisMonth.getFullYear() })
  const monthExps = expenses.filter(e=>{ const d=new Date(e.date); return d.getMonth()===thisMonth.getMonth()&&d.getFullYear()===thisMonth.getFullYear() })
  const totalRev = monthRevs.reduce((s,r)=>s+(r.total||0),0)
  const totalExp = monthExps.reduce((s,e)=>s+(e.amount||0),0)
  const netProfit = totalRev - totalExp
  const costPct = totalRev>0?Math.round(totalExp/totalRev*100):0
  const lowStock = wms.filter(i=>(i.stock||0)<=(i.min_stock||5)).length

  // Daily revenue last 7 days
  const last7 = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-i)
    const dateStr=d.toISOString().split('T')[0]
    const rev=revenues.filter(r=>r.date===dateStr).reduce((s,r)=>s+(r.total||0),0)
    const exp=expenses.filter(e=>e.date===dateStr).reduce((s,e)=>s+(e.amount||0),0)
    return {date:dateStr,rev,exp,profit:rev-exp}
  }).reverse()

  const maxRev = Math.max(...last7.map(d=>d.rev),1)

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{padding:'16px'}}>
        <h1 className="page-title">📈 لوحة الإدارة العليا</h1>

        {/* Month KPIs */}
        <div style={{background:'linear-gradient(135deg,#0A0A14,#060610)',border:'1px solid rgba(201,168,76,.2)',borderRadius:'12px',padding:'16px',marginBottom:'14px'}}>
          <div style={{fontSize:'10px',color:'var(--text)',marginBottom:'10px',letterSpacing:'2px'}}>ملخص الشهر الحالي</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'10px'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)'}}>الإيرادات</div>
              <div style={{fontFamily:'monospace',fontSize:'16px',fontWeight:'900',color:'var(--green)'}}>{(totalRev/1000).toFixed(1)}K</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)'}}>المصروفات</div>
              <div style={{fontFamily:'monospace',fontSize:'16px',fontWeight:'900',color:'var(--red)'}}>{(totalExp/1000).toFixed(1)}K</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)'}}>الربح</div>
              <div style={{fontFamily:'monospace',fontSize:'16px',fontWeight:'900',color:netProfit>=0?'var(--gold)':'var(--red)'}}>{(netProfit/1000).toFixed(1)}K</div>
            </div>
          </div>
          <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)'}}>نسبة الكوست</div>
              <div style={{fontFamily:'monospace',fontSize:'20px',fontWeight:'900',color:costPct<=35?'var(--green)':costPct<=45?'var(--yellow)':'var(--red)'}}>{costPct}%</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)'}}>هامش الربح</div>
              <div style={{fontFamily:'monospace',fontSize:'20px',fontWeight:'900',color:'var(--blue)'}}>{100-costPct}%</div>
            </div>
          </div>
        </div>

        {/* 7-day bar chart */}
        <div className="card" style={{marginBottom:'12px'}}>
          <h3 className="card-title">📊 الإيراد اليومي — آخر 7 أيام</h3>
          <div style={{display:'flex',gap:'4px',alignItems:'flex-end',height:'100px',padding:'0 4px'}}>
            {last7.map(d=>(
              <div key={d.date} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}}>
                <div style={{width:'100%',background:d.rev>0?'var(--gold)':'rgba(255,255,255,.05)',borderRadius:'3px 3px 0 0',height:`${maxRev>0?Math.round(d.rev/maxRev*80):4}px`,minHeight:'4px',transition:'height .3s'}}/>
                <div style={{fontSize:'7px',color:'var(--muted)',textAlign:'center',transform:'rotate(-30deg)',transformOrigin:'center',marginTop:'4px'}}>{d.date.slice(5)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <h3 className="card-title">🚨 تنبيهات</h3>
          {lowStock>0&&<div className="alert-warning" style={{marginBottom:'6px'}}>⚠️ {lowStock} أصناف في المستودع وصلت للحد الأدنى</div>}
          {costPct>45&&<div style={{background:'rgba(255,59,92,.1)',border:'1px solid rgba(255,59,92,.3)',borderRadius:'7px',padding:'8px 12px',fontSize:'11px',color:'var(--red)',marginBottom:'6px'}}>🔴 نسبة الكوست {costPct}% — تجاوزت الحد المسموح (45%)</div>}
          {netProfit<0&&<div style={{background:'rgba(255,59,92,.1)',border:'1px solid rgba(255,59,92,.3)',borderRadius:'7px',padding:'8px 12px',fontSize:'11px',color:'var(--red)',marginBottom:'6px'}}>📉 خسارة هذا الشهر: {Math.abs(netProfit).toLocaleString()} د.ع</div>}
          {lowStock===0&&costPct<=45&&netProfit>=0&&(
            <div style={{background:'rgba(0,212,106,.1)',border:'1px solid rgba(0,212,106,.3)',borderRadius:'7px',padding:'8px 12px',fontSize:'11px',color:'var(--green)'}}>✅ لا توجد تنبيهات — الوضع جيد</div>
          )}
        </div>
      </div>
    </Layout>
  )
}
