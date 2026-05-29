import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/router'

const ADMIN_EMAIL = 'foodops159@gmail.com'

export default function AdminPage({ session }) {
  const router = useRouter()
  const [requests, setRequests] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) { router.push('/'); return }
    if (session.user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
    loadData()
  }, [session])

  const loadData = async () => {
    const [{ data: reqs }, { data: rests }] = await Promise.all([
      supabase.from('signup_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('restaurants').select('*').order('created_at', { ascending: false }),
    ])
    setRequests(reqs || [])
    setRestaurants(rests || [])
    setLoading(false)
  }

  const approveRequest = async (req) => {
    try {
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: req.restaurant_name,
          type: req.restaurant_type || 'مطعم',
          is_active: true,
          plan: 'monthly',
          plan_expires: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        })
        .select()
        .single()

      if (restError) { alert('خطأ: ' + restError.message); return }

      const { error: linkError } = await supabase
        .from('restaurant_users')
        .insert({ user_id: req.user_id, restaurant_id: restaurant.id, role: 'admin' })

      if (linkError) { alert('خطأ في الربط: ' + linkError.message); return }

      await supabase.from('signup_requests').update({ status: 'approved' }).eq('id', req.id)

      alert('✅ تم تفعيل ' + req.restaurant_name)

      const msg = 'مرحباً ' + req.restaurant_name + ' 👋\n\nتم تفعيل اشتراككم في منصة Food Ops ✅\n\nرابط التطبيق:\nhttps://foodopsv3.vercel.app\n\nالبريد: ' + req.email + '\n\nللدعم: foodops159@gmail.com'
      if (confirm('إرسال إشعار واتساب للعميل؟')) {
       window.location.href = 'https://wa.me/?text=' + encodeURIComponent(msg)  + encodeURIComponent(msg), '_blank')
      }

      loadData()
    } catch(e) { alert('خطأ: ' + e.message) }
  }

  const rejectRequest = async (req) => {
    if (!confirm('رفض طلب ' + req.restaurant_name + '؟')) return
    await supabase.from('signup_requests').update({ status: 'rejected' }).eq('id', req.id)
    loadData()
  }

  const toggleRestaurant = async (id, currentStatus) => {
    await supabase.from('restaurants').update({ is_active: !currentStatus }).eq('id', id)
    loadData()
  }

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',background:'#0A0A14',color:'#C9A84C',fontSize:'24px'}}>⚡</div>

  const pending = requests.filter(r => r.status === 'pending')

  return (
    <div style={{minHeight:'100vh',background:'#0A0A14',direction:'rtl',fontFamily:'Cairo,sans-serif',color:'#FAF7F0'}}>
      <div style={{background:'#111118',borderBottom:'1px solid rgba(255,255,255,.08)',padding:'14px 20px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontSize:'16px',fontWeight:'900',color:'#C9A84C',letterSpacing:'2px'}}>⚡ FOOD OPS — ADMIN</div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
          style={{background:'rgba(255,59,92,.1)',border:'1px solid rgba(255,59,92,.2)',borderRadius:'6px',padding:'6px 14px',color:'#FF3B5C',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px'}}>
          خروج
        </button>
      </div>

      <div style={{maxWidth:'900px',margin:'0 auto',padding:'20px'}}>

        <div style={{background:'#161620',border:'1px solid rgba(255,255,255,.06)',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>
            ⏳ طلبات الاشتراك
            {pending.length > 0 && <span style={{background:'#FF3B5C',color:'#fff',borderRadius:'50%',padding:'1px 7px',fontSize:'10px',marginRight:'8px'}}>{pending.length}</span>}
          </h2>
          {pending.length === 0 ? (
            <div style={{textAlign:'center',padding:'20px',color:'#555',fontSize:'12px'}}>لا توجد طلبات جديدة</div>
          ) : (
            pending.map(req => (
              <div key={req.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px',background:'rgba(0,0,0,.2)',borderRadius:'8px',marginBottom:'8px'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:'700',fontSize:'13px'}}>{req.restaurant_name}</div>
                  <div style={{fontSize:'10px',color:'#8A8490',marginTop:'2px'}}>{req.restaurant_type} · {req.email}</div>
                </div>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={() => approveRequest(req)}
                    style={{background:'rgba(0,212,106,.15)',border:'1px solid rgba(0,212,106,.3)',color:'#00D46A',borderRadius:'6px',padding:'7px 16px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:'700'}}>
                    ✅ موافقة
                  </button>
                  <button onClick={() => rejectRequest(req)}
                    style={{background:'rgba(255,59,92,.1)',border:'1px solid rgba(255,59,92,.2)',color:'#FF3B5C',borderRadius:'6px',padding:'7px 16px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px'}}>
                    ❌ رفض
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{background:'#161620',border:'1px solid rgba(255,255,255,.06)',borderRadius:'10px',padding:'20px'}}>
          <h2 style={{fontSize:'14px',fontWeight:'700',marginBottom:'14px'}}>🏪 المطاعم المشتركة ({restaurants.length})</h2>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
            <thead>
              <tr>{['المطعم','النوع','الخطة','الحالة',''].map(h=><th key={h} style={{background:'rgba(0,0,0,.3)',padding:'8px 10px',textAlign:'right',color:'#C9A84C',fontSize:'10px'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {restaurants.map(r => (
                <tr key={r.id}>
                  <td style={{padding:'9px 10px',borderBottom:'1px solid rgba(255,255,255,.04)',fontWeight:'700'}}>{r.name}</td>
                  <td style={{padding:'9px 10px',borderBottom:'1px solid rgba(255,255,255,.04)',color:'#8A8490',fontSize:'10px'}}>{r.type}</td>
                  <td style={{padding:'9px 10px',borderBottom:'1px solid rgba(255,255,255,.04)'}}>{r.plan}</td>
                  <td style={{padding:'9px 10px',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'4px',background:r.is_active?'rgba(0,212,106,.1)':'rgba(255,59,92,.1)',color:r.is_active?'#00D46A':'#FF3B5C'}}>
                      {r.is_active ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td style={{padding:'9px 10px',borderBottom:'1px solid rgba(255,255,255,.04)'}}>
                    <button onClick={() => toggleRestaurant(r.id, r.is_active)}
                      style={{background:'transparent',border:'1px solid rgba(255,255,255,.08)',borderRadius:'5px',padding:'4px 10px',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'10px',color:'#8A8490'}}>
                      {r.is_active ? '⏸ إيقاف' : '▶ تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
