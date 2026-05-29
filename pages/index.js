import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantType, setRestaurantType] = useState('كافيه')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) { setError(error.message); setLoading(false); return }
    
    // Check if restaurant is approved
    const { data: ru } = await supabase
      .from('restaurant_users')
      .select('restaurant_id, restaurants(is_active)')
      .eq('user_id', data.user.id)
      .single()
    
    if (!ru) { setError('حسابك غير مرتبط بمطعم — تواصل مع Food Ops'); setLoading(false); return }
    if (!ru.restaurants?.is_active) { setError('حسابك قيد المراجعة — سيتم التواصل معك قريباً'); setLoading(false); return }
    
    router.push('/dashboard')
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    
    if (!restaurantName) { setError('أدخل اسم المطعم'); setLoading(false); return }
    
    // Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    
    // Create pending restaurant request
    await supabase.from('signup_requests').insert({
      user_id: data.user?.id,
      email,
      restaurant_name: restaurantName,
      restaurant_type: restaurantType,
      status: 'pending'
    })
    
    setMessage('✅ تم إرسال طلبك — ستتلقى بريداً إلكترونياً بعد موافقة الإدارة')
    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-bg" />
      
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">⚡ FOOD OPS</div>
          <div className="auth-logo-sub">RESTAURANT MANAGEMENT PLATFORM</div>
          <div className="auth-logo-line" />
          <div className="auth-logo-desc">نظام إدارة المطاعم الاحترافي</div>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setMessage('') }}
          >دخول</button>
          <button 
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => { setMode('signup'); setError(''); setMessage('') }}
          >طلب اشتراك</button>
        </div>

        {message && <div className="auth-success">{message}</div>}
        {error && <div className="auth-error">{error}</div>}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>البريد الإلكتروني</label>
              <input 
                type="email" value={email} 
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required dir="ltr"
              />
            </div>
            <div className="form-group">
              <label>كلمة المرور</label>
              <input 
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '⏳ جاري الدخول...' : 'دخول ←'}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="auth-form">
            <div className="form-group">
              <label>اسم المطعم / المنشأة *</label>
              <input 
                type="text" value={restaurantName}
                onChange={e => setRestaurantName(e.target.value)}
                placeholder="مثال: The Mind Café"
                required
              />
            </div>
            <div className="form-group">
              <label>نوع المنشأة</label>
              <select value={restaurantType} onChange={e => setRestaurantType(e.target.value)}>
                <option>كافيه</option>
                <option>كافيه-ترفيه</option>
                <option>مطعم</option>
                <option>بيتزا</option>
                <option>سوشي</option>
                <option>وجبات سريعة</option>
                <option>حلويات</option>
              </select>
            </div>
            <div className="form-group">
              <label>البريد الإلكتروني *</label>
              <input 
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required dir="ltr"
              />
            </div>
            <div className="form-group">
              <label>كلمة المرور *</label>
              <input 
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                minLength={8}
                required
              />
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '⏳ جاري الإرسال...' : '📨 إرسال طلب الاشتراك'}
            </button>
            <p className="auth-note">
              سيتم مراجعة طلبك من قبل فريق Food Ops وإشعارك خلال 24 ساعة
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
