import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchData } from '../../lib/supabase'
import Layout from '../../components/Layout'

export default function FinancePage({ session }) {
  const router = useRouter()
  const [revenues, setRevenues] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    if (!session) { router.push('/'); return }
    Promise.all([fetchData('revenues'), fetchData('expenses')]).then(([r,e])=>{
      setRevenues(r); setExpenses(e); setLoading(false)
    })
  }, [session])

  const today = new Date()
  const filterByPeriod = (arr, dateKey='date') => {
    return arr.filter(r => {
      const d = new Date(r[dateKey])
      if (period==='today') return r[dateKey]===today.toISOString().split('T')[0]
      if (period==='week') return (today-d)/86400000<=7
      if (period==='month') return d.getMonth()===today.getMonth()&&d.getFullYear()===today.getFullYear()
      return true
    })
  }

  const filtRev = filterByPeriod(revenues)
  const filtExp = filterByPeriod(expenses)
  const totalRev = filtRev.reduce((s,r)=>s+(r.total||0),0)
  const totalExp = filtExp.reduce((s,e)=>s+(e.amount||0),0)
  const grossProfit = totalRev - totalExp
  const costPct = totalRev>0?Math.round(totalExp/totalRev*100):0

  // Group expenses by category
  const expByCat = filtExp.reduce((acc,e)=>{acc[e.cat||'أخرى']=(acc[e.cat||'أخرى']||0)+(e.amount||0);return acc},{})

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{padding:'16px'}}>
        <h1 className="page-title">💹 التقارير المالية</h1>

        {/* Period selector */}
        <div style={{display:'flex',gap:'6px',marginBottom:'14px'}}>
          {[['today','اليوم'],['week','7 أيام'],['month','هذا الشهر'],['all','الكل']].map(([id,label])=>(
            <button key={id} onClick={()=>setPeriod(id)}
              style={{padding:'7px 14px',borderRadius:'7px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',fontWeight:period===id?'700':'400',background:period===id?'rgba(201,168,76,.15)':'rgba(255,255,255,.05)',color:period===id?'var(--gold)':'var(--text)'}}>
              {label}
            </button>
          ))}
        </div>

        {/* P&L Summary */}
        <div style={{background:'linear-gradient(135deg,#0A0A14,#060610)',border:'1px solid rgba(201,168,76,.2)',borderRadius:'12px',padding:'16px',marginBottom:'14px'}}>
          <div style={{fontSize:'11px',color:'var(--text)',marginBottom:'12px',letterSpacing:'2px'}}>P&L — الربح والخسارة</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
            <div>
              <div style={{fontSize:'9px',color:'var(--text)',marginBottom:'3px'}}>الإيرادات</div>
              <div style={{fontFamily:'monospace',fontSize:'20px',fontWeight:'900',color:'var(--green)'}}>{totalRev.toLocaleString()}</div>
            </div>
            <div>
              <div style={{fontSize:'9px',color:'var(--text)',marginBottom:'3px'}}>المصروفات</div>
              <div style={{fontFamily:'monospace',fontSize:'20px',fontWeight:'900',color:'var(--red)'}}>{totalExp.toLocaleString()}</div>
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:'12px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'9px',color:'var(--text)',marginBottom:'3px'}}>صافي الربح</div>
              <div style={{fontFamily:'monospace',fontSize:'24px',fontWeight:'900',color:grossProfit>=0?'var(--gold)':'var(--red)'}}>{grossProfit.toLocaleString()}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)',marginBottom:'3px'}}>نسبة الكوست</div>
              <div style={{fontFamily:'monospace',fontSize:'22px',fontWeight:'900',color:costPct<=35?'var(--green)':costPct<=45?'var(--yellow)':'var(--red)'}}>{costPct}%</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'9px',color:'var(--text)',marginBottom:'3px'}}>هامش الربح</div>
              <div style={{fontFamily:'monospace',fontSize:'22px',fontWeight:'900',color:'var(--blue)'}}>{100-costPct}%</div>
            </div>
          </div>
        </div>

        {/* Expenses breakdown */}
        <div className="card" style={{marginBottom:'12px'}}>
          <h3 className="card-title">تفصيل المصروفات</h3>
          {Object.entries(expByCat).sort((a,b)=>b[1]-a[1]).map(([cat,amount])=>(
            <div key={cat} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
              <div style={{flex:1,fontSize:'12px'}}>{cat}</div>
              <div style={{fontFamily:'monospace',fontSize:'12px',color:'var(--red)'}}>{amount.toLocaleString()}</div>
              <div style={{width:'80px',height:'6px',background:'rgba(255,255,255,.08)',borderRadius:'3px',overflow:'hidden'}}>
                <div style={{height:'100%',width:`${totalExp>0?Math.round(amount/totalExp*100):0}%`,background:'var(--red)',borderRadius:'3px'}}/>
              </div>
              <div style={{fontSize:'9px',color:'var(--muted)',width:'30px',textAlign:'left'}}>{totalExp>0?Math.round(amount/totalExp*100):0}%</div>
            </div>
          ))}
        </div>

        {/* Revenue by shift */}
        <div className="card">
          <h3 className="card-title">الإيراد حسب الشفت</h3>
          {['صباحي','مسائي','ليلي'].map(shift=>{
            const shiftRev=filtRev.filter(r=>r.shift===shift).reduce((s,r)=>s+(r.total||0),0)
            return (
              <div key={shift} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                <div style={{width:'60px',fontSize:'12px'}}>{shift}</div>
                <div style={{flex:1,height:'8px',background:'rgba(255,255,255,.06)',borderRadius:'4px',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${totalRev>0?Math.round(shiftRev/totalRev*100):0}%`,background:'var(--gold)',borderRadius:'4px',transition:'width .5s'}}/>
                </div>
                <div style={{fontFamily:'monospace',fontSize:'12px',color:'var(--gold)',width:'90px',textAlign:'left'}}>{shiftRev.toLocaleString()}</div>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
