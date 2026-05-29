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
      // Generate access code
      const code = 'FO' + Math.random().toString(36).substring(2,8).toUpperCase()

      // Create restaurant
      const { data: restaurant, error: restError } = await supabase
        .from('restaurants')
        .insert({
          name: req.restaurant_name,
          type: req.restaurant_type,
          is_active: true,
          plan: 'monthly',
          access_code: code,
          plan_expires: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        })
        .select()
        .single()

      if (restError) { alert('خطأ: ' + restError.message); return }

      // Link user to restaurant
      const { error: linkError } = await supabase
        .from('restaurant_users')
        .insert({
          user_id: req.user_id,
          restaurant_id: restaurant.id,
          role: 'admin',
        })

      if (linkError) { alert('خطأ في الربط: ' + linkError.message); return }

      // Update request status
      await supabase
        .from('signup_requests')
        .update({ status: 'approved' })
        .eq('id', req.id)

      alert(`✅ تم تفعيل "${req.restaurant_name}"\nكود الوصول: ${code}`)
      loadData()
    } catch(e) {
      alert('خطأ: ' + e.message)
    }
  }

  const toggleRestaurant = async (id, currentStatus) => {
    await supabase.from('restaurants').update({ is_active: !currentStatus }).eq('id', id)
    loadData()
  }

  if (loading) return <div className="loading-screen"><div className="loading-logo">⚡</div></div>

  return (
    <div className="admin-page" dir="rtl">
      <div className="admin-header">
        <div className="admin-logo">⚡ FOOD OPS — ADMIN</div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}>خروج</button>
      </div>

      <div className="admin-container">

        {/* Pending Requests */}
        <div className="admin-card">
          <h2>⏳ طلبات الاشتراك ({requests.filter(r => r.status === 'pending').length})</h2>
          {requests.filter(r => r.status === 'pending').map(req => (
            <div key={req.id} className="request-row">
              <div className="request-info">
                <div className="request-name">{req.restaurant_name}</div>
                <div className="request-meta">{req.restaurant_type} · {req.email}</div>
                <div className="request-date">{new Date(req.created_at).toLocaleDateString('ar-IQ')}</div>
              </div>
              <div className="request-actions">
                <button className="btn-approve" onClick={() => approveRequest(req)}>✅ موافقة</button>
                <button className="btn-reject" onClick={async () => {
                  await supabase.from('signup_requests').update({ status: 'rejected' }).eq('id', req.id)
                  loadData()
                }}>❌ رفض</button>
              </div>
            </div>
          ))}
          {!requests.filter(r => r.status === 'pending').length && (
            <div className="empty-state">لا توجد طلبات جديدة</div>
          )}
        </div>

        {/* Active Restaurants */}
        <div className="admin-card">
          <h2>🏪 المطاعم المشتركة ({restaurants.length})</h2>
          <table className="admin-table">
            <thead>
              <tr><th>المطعم</th><th>النوع</th><th>الخطة</th><th>انتهاء</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {restaurants.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.type}</td>
                  <td>{r.plan}</td>
                  <td>{r.plan_expires}</td>
                  <td>
                    <span className={r.is_active ? 'badge-active' : 'badge-inactive'}>
                      {r.is_active ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-toggle" onClick={() => toggleRestaurant(r.id, r.is_active)}>
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
