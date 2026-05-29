import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useState } from 'react'

const NAV_ITEMS = [
  { href:'/dashboard',          icon:'📊', label:'الرئيسية' },
  { href:'/dashboard/revenues', icon:'💰', label:'الإيرادات' },
  { href:'/dashboard/expenses', icon:'💸', label:'المصروفات' },
  { href:'/dashboard/finance',  icon:'💹', label:'التقارير المالية' },
  { href:'/dashboard/wms',      icon:'📦', label:'المستودع' },
  { href:'/dashboard/cld',      icon:'🔗', label:'جك لاين' },
  { href:'/dashboard/kitchen',  icon:'🏭', label:'المطبخ' },
  { href:'/dashboard/employees',icon:'👥', label:'الموظفون' },
  { href:'/dashboard/haccp',    icon:'🌡️', label:'HACCP' },
  { href:'/dashboard/menu',     icon:'🍽️', label:'هندسة المنيو' },
  { href:'/dashboard/reports',  icon:'📈', label:'لوحة الإدارة' },
]

export default function Layout({ session, children }) {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="dashboard">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-brand">
          <button onClick={()=>setSidebarOpen(!sidebarOpen)}
            style={{background:'none',border:'none',color:'var(--gold)',fontSize:'18px',cursor:'pointer',padding:'4px 8px',display:'none'}}
            className="menu-toggle">☰</button>
          <span className="topbar-logo">⚡</span>
          <span className="topbar-name">FOOD OPS</span>
        </div>
        <div className="topbar-actions">
          <span style={{fontSize:'10px',color:'var(--muted)',marginLeft:'8px'}}>{session?.user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>خروج</button>
        </div>
      </div>

      <div className="layout">
        {/* Sidebar */}
        <nav className={`sidebar ${sidebarOpen?'open':''}`}>
          {NAV_ITEMS.map(item => (
            <button key={item.href}
              className={`nav-item ${router.pathname===item.href?'active':''}`}
              onClick={()=>{router.push(item.href);setSidebarOpen(false)}}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <main className="main-content">{children}</main>
      </div>

      <style jsx global>{`
        @media (max-width: 600px) {
          .menu-toggle { display: block !important; }
          .sidebar { transform: translateX(100%); transition: transform .3s; position: fixed; top: 49px; right: 0; bottom: 0; z-index: 200; }
          .sidebar.open { transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
