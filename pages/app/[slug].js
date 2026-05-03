import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { getRestaurant } from '../../lib/supabase'

export default function AppPage() {
  const router = useRouter()
  const { slug } = router.query
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    loadRestaurant()
  }, [slug])

  async function loadRestaurant() {
    const { data, error } = await getRestaurant(slug)
    if (error || !data) {
      setNotFound(true)
    } else {
      setRestaurant(data)
    }
    setLoading(false)
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Cairo, sans-serif',
      color: '#C9A84C',
      fontSize: 18
    }}>
      ⚡ جاري التحميل...
    </div>
  )

  if (notFound) return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0A0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'Cairo, sans-serif',
      color: '#fff',
      textAlign: 'center',
      padding: 20
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <h2 style={{ color: '#ff3b5c' }}>المطعم غير موجود</h2>
      <p style={{ color: '#666' }}>تحقق من الرابط أو سجّل مطعمك</p>
      <a href="/" style={{ color: '#C9A84C', marginTop: 16 }}>الصفحة الرئيسية ←</a>
    </div>
  )

  return (
    <>
      <Head>
        <title>{restaurant.name_ar || restaurant.name} — Food Ops</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&family=Tajawal:wght@400;700;900&display=swap" rel="stylesheet" />
      </Head>
      <div style={{
        minHeight: '100vh',
        background: '#0A0A0F',
        fontFamily: 'Cairo, sans-serif',
        direction: 'rtl',
        color: '#fff'
      }}>
        <div style={{
          background: '#0D0D14',
          borderBottom: '1px solid #1a1a2e',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              fontFamily: 'Tajawal, sans-serif',
              fontWeight: 900,
              fontSize: 16,
              color: '#C9A84C'
            }}>
              {restaurant.name_ar || restaurant.name}
            </div>
            <div style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>
              FOOD OPS · {restaurant.plan?.toUpperCase()}
            </div>
          </div>
          <div style={{
            fontSize: 9,
            color: '#00D46A',
            fontFamily: 'monospace',
            background: 'rgba(0,212,106,.08)',
            padding: '3px 8px',
            borderRadius: 4
          }}>
            LIVE
          </div>
        </div>

        <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            background: '#111',
            border: '1px solid rgba(201,168,76,.2)',
            borderRadius: 14,
            padding: 24,
            textAlign: 'center',
            marginBottom: 16
          }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>⚡</div>
            <div style={{
              fontFamily: 'Tajawal, sans-serif',
              fontSize: 22,
              fontWeight: 900,
              color: '#C9A84C',
              marginBottom: 6
            }}>
              {restaurant.name_ar || restaurant.name}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {restaurant.city}
            </div>
          </div>

          <div style={{
            background: '#0a1a0f',
            border: '1px solid rgba(0,212,106,.2)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
            <div style={{ fontWeight: 700, color: '#00D46A', marginBottom: 8 }}>
              النظام متصل بـ Supabase
            </div>
            <div style={{ fontSize: 11, color: '#555' }}>
              foodops-platform · {restaurant.slug}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
