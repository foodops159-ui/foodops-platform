export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl',
      color: '#fff',
      textAlign: 'center',
      padding: 20
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
      <h1 style={{
        fontFamily: 'Tajawal, sans-serif',
        fontSize: 40,
        fontWeight: 900,
        color: '#C9A84C',
        marginBottom: 8
      }}>
        •Food Ops
      </h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 48 }}>
        نظام إدارة المطاعم الأكثر تكاملاً في العراق
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        marginBottom: 48,
        maxWidth: 500,
        width: '100%'
      }}>
        {[
          ['📦', 'إدارة المستودع WMS'],
          ['💰', 'المركز المالي الموحد'],
          ['👥', 'إدارة الموظفين وHR'],
          ['🤖', 'محرك الأتمتة الذكية'],
          ['📊', 'تقارير CEO لحظية'],
          ['🔗', 'ربط مع الكاشير والبصمة'],
        ].map(([icon, text]) => (
          <div key={text} style={{
            background: '#111',
            border: '1px solid #222',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textAlign: 'right'
          }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ fontSize: 12 }}>{text}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10,
        marginBottom: 40,
        maxWidth: 500,
        width: '100%'
      }}>
        {[
          { name: 'Starter', price: '$5', desc: 'فرع واحد', color: '#4a9f6f' },
          { name: 'Pro', price: '$15', desc: 'فرعان + كل الوحدات', color: '#C9A84C' },
          { name: 'Enterprise', price: '$30', desc: 'غير محدود + API', color: '#4d9fff' },
        ].map(plan => (
          <div key={plan.name} style={{
            background: '#111',
            border: `1px solid ${plan.color}44`,
            borderRadius: 10,
            padding: 14,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 11, color: plan.color, fontWeight: 700 }}>{plan.name}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: plan.color, margin: '4px 0' }}>{plan.price}</div>
            <div style={{ fontSize: 9, color: '#666' }}>{plan.desc}</div>
          </div>
        ))}
      </div>

      <a href="/app/the-mind" style={{
        display: 'block',
        background: '#C9A84C',
        color: '#000',
        textDecoration: 'none',
        borderRadius: 10,
        padding: '16px 40px',
        fontSize: 16,
        fontWeight: 900,
        maxWidth: 400,
        width: '100%'
      }}>
        جرّب النظام — The Mind Café ←
      </a>
    </div>
  )
}
