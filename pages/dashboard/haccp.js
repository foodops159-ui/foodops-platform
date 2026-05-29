import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase, fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const DEVICE_TYPES = [
  { value: 'fridge',  label: '🧊 ثلاجة',         min: -2,  max: 4   },
  { value: 'freezer', label: '❄️ فريزر',          min: -25, max: -18 },
  { value: 'walkin',  label: '🏠 غرفة باردة',     min: 0,   max: 4   },
  { value: 'prep',    label: '🥗 ثلاجة تحضير',    min: 2,   max: 8   },
  { value: 'hot',     label: '🔥 تدفئة ساخنة',    min: 63,  max: 85  },
]

export default function HACCPPage({ session }) {
  const router = useRouter()
  const [devices, setDevices] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('log')
  const [histDate, setHistDate] = useState(new Date().toISOString().split('T')[0])
  const [userName, setUserName] = useState('')
  const [tempValues, setTempValues] = useState({})
  const [tempNotes, setTempNotes] = useState({})
  const [tempPhotos, setTempPhotos] = useState({})
  const [saving, setSaving] = useState({})
  // Device form
  const [devForm, setDevForm] = useState({ name: '', location: '', device_type: 'fridge', stores: 'متعدد', min_temp: -2, max_temp: 4, is_ccp: true })
  const [editDevId, setEditDevId] = useState(null)

  useEffect(() => {
    if (!session) { router.push('/'); return }
    load()
  }, [session])

  const load = async () => {
    const [devData, logData] = await Promise.all([
      fetchData('cooling_devices'),
      fetchData('temp_logs'),
    ])
    setDevices(devData.filter(d => d.is_active !== false))
    setLogs(logData)
    setLoading(false)
  }

  const today = new Date().toISOString().split('T')[0]

  const logTemp = async (device) => {
    const temp = parseFloat(tempValues[device.id])
    if (isNaN(temp)) { alert('أدخل درجة الحرارة'); return }
    if (!userName.trim()) { alert('أدخل اسم المسجّل'); return }

    setSaving(p => ({ ...p, [device.id]: true }))
    const isOk = temp >= device.min_temp && temp <= device.max_temp
    const photo = tempPhotos[device.id] || null

    try {
      const record = {
        id: crypto.randomUUID(),
        device_name: device.name,
        device_type: device.device_type,
        temp,
        min_ok: device.min_temp,
        max_ok: device.max_temp,
        is_ok: isOk,
        logged_by: userName,
        notes: tempNotes[device.id] || '',
        date: today,
        is_ccp: device.is_ccp,
        // Store photo as base64 in notes if small
      }
      const saved = await saveData('temp_logs', record)
      setLogs(p => [saved, ...p])

      // Clear inputs for this device
      setTempValues(p => { const n = { ...p }; delete n[device.id]; return n })
      setTempNotes(p => { const n = { ...p }; delete n[device.id]; return n })
      setTempPhotos(p => { const n = { ...p }; delete n[device.id]; return n })

      if (!isOk) {
        alert(`⚠️ تنبيه: ${device.name}\n${temp}°C خارج النطاق المسموح (${device.min_temp}°C ← ${device.max_temp}°C)`)
      }
    } catch (e) { alert('خطأ: ' + e.message) }
    setSaving(p => ({ ...p, [device.id]: false }))
  }

  const handlePhoto = (devId, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => setTempPhotos(p => ({ ...p, [devId]: e.target.result }))
    reader.readAsDataURL(file)
  }

  const saveDevice = async () => {
    if (!devForm.name.trim()) { alert('أدخل اسم الجهاز'); return }
    if (devForm.min_temp >= devForm.max_temp) { alert('الحد الأدنى يجب أن يكون أقل من الأقصى'); return }
    try {
      const record = { ...devForm, id: editDevId || crypto.randomUUID(), is_active: true }
      const saved = await saveData('cooling_devices', record)
      if (editDevId) {
        setDevices(p => p.map(d => d.id === editDevId ? saved : d))
      } else {
        setDevices(p => [...p, saved])
      }
      setDevForm({ name: '', location: '', device_type: 'fridge', stores: 'متعدد', min_temp: -2, max_temp: 4, is_ccp: true })
      setEditDevId(null)
      setTab('log')
    } catch (e) { alert('خطأ: ' + e.message) }
  }

  const deleteDevice = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    await saveData('cooling_devices', { id, is_active: false })
    setDevices(p => p.filter(d => d.id !== id))
  }

  const startEditDev = (dev) => {
    setDevForm({ name: dev.name, location: dev.location || '', device_type: dev.device_type || 'fridge', stores: dev.stores || 'متعدد', min_temp: dev.min_temp, max_temp: dev.max_temp, is_ccp: dev.is_ccp !== false })
    setEditDevId(dev.id)
    setTab('setup')
  }

  const histLogs = logs.filter(l => l.date === histDate)
  const todayLogs = logs.filter(l => l.date === today)

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{ padding: '16px' }}>
        <h1 className="page-title">🌡️ HACCP — مراقبة أجهزة التبريد</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[['log', '🌡️ تسجيل يومي'], ['history', '📋 السجل'], ['setup', '⚙️ إعداد الأجهزة']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ padding: '8px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '12px', fontWeight: tab === id ? '700' : '400', background: tab === id ? 'rgba(77,158,255,.15)' : 'rgba(255,255,255,.05)', color: tab === id ? 'var(--blue)' : 'var(--text)' }}>
              {label}
            </button>
          ))}
        </div>

        {/* LOG TAB */}
        {tab === 'log' && (
          <div>
            {/* Logged by */}
            <div className="card" style={{ marginBottom: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>👤 اسم المسجّل (يُطبَّق على كل الأجهزة)</label>
                <input type="text" value={userName} onChange={e => setUserName(e.target.value)}
                  placeholder="اسم الموظف المسؤول" />
              </div>
            </div>

            {devices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)', fontSize: '12px' }}>
                لا توجد أجهزة — أضف من تبويب "إعداد الأجهزة"
              </div>
            ) : (
              devices.map(dev => {
                const temp = tempValues[dev.id]
                const isOk = temp !== undefined && temp !== '' ? parseFloat(temp) >= dev.min_temp && parseFloat(temp) <= dev.max_temp : null
                const todayDevLogs = todayLogs.filter(l => l.device_name === dev.name)
                const lastLog = todayDevLogs[0]

                return (
                  <div key={dev.id} className="card" style={{ marginBottom: '10px', borderColor: isOk === false ? 'rgba(255,59,92,.4)' : dev.is_ccp ? 'rgba(255,59,92,.15)' : 'var(--border)' }}>
                    {/* Device header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{DEVICE_TYPES.find(t => t.value === dev.device_type)?.label.split(' ')[0] || '❄️'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '13px' }}>{dev.name}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text)' }}>
                          {dev.location && `📍 ${dev.location} · `}
                          🌡️ نطاق مسموح: {dev.min_temp}°C ← {dev.max_temp}°C
                          {dev.is_ccp && <span style={{ color: 'var(--red)', marginRight: '6px' }}> · ⚠️ CCP</span>}
                        </div>
                      </div>
                      {lastLog && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '900', color: lastLog.is_ok ? 'var(--green)' : 'var(--red)' }}>{lastLog.temp}°C</div>
                          <div style={{ fontSize: '8px', color: 'var(--muted)' }}>آخر قراءة</div>
                        </div>
                      )}
                    </div>

                    {/* Input */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '100px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>درجة الحرارة °C *</div>
                        <input type="number" step="0.1"
                          value={tempValues[dev.id] || ''}
                          onChange={e => setTempValues(p => ({ ...p, [dev.id]: e.target.value }))}
                          placeholder={`${dev.min_temp} ← ${dev.max_temp}`}
                          style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,.3)', border: `1px solid ${isOk === false ? 'var(--red)' : isOk === true ? 'var(--green)' : 'var(--border)'}`, borderRadius: '6px', fontFamily: 'monospace', fontSize: '16px', color: 'var(--white)', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text)', marginBottom: '3px' }}>ملاحظات</div>
                        <input type="text" value={tempNotes[dev.id] || ''} onChange={e => setTempNotes(p => ({ ...p, [dev.id]: e.target.value }))}
                          placeholder="اختياري"
                          style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,.3)', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'Cairo, sans-serif', fontSize: '11px', color: 'var(--white)', outline: 'none' }} />
                      </div>
                    </div>

                    {/* Status preview */}
                    {isOk !== null && (
                      <div style={{ padding: '6px 10px', borderRadius: '5px', marginBottom: '8px', fontSize: '11px', fontWeight: '700', background: isOk ? 'rgba(0,212,106,.1)' : 'rgba(255,59,92,.1)', color: isOk ? 'var(--green)' : 'var(--red)', border: `1px solid ${isOk ? 'rgba(0,212,106,.3)' : 'rgba(255,59,92,.3)'}` }}>
                        {isOk ? `✅ ضمن النطاق (${dev.min_temp}°C ← ${dev.max_temp}°C)` : `❌ خارج النطاق! المسموح: ${dev.min_temp}°C ← ${dev.max_temp}°C`}
                      </div>
                    )}

                    {/* Photo */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ cursor: 'pointer', background: 'rgba(77,158,255,.1)', border: '1px solid rgba(77,158,255,.2)', borderRadius: '6px', padding: '6px 12px', fontSize: '10px', color: 'var(--blue)' }}>
                        📷 إرفاق صورة الميزان
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handlePhoto(dev.id, e.target.files?.[0])} />
                      </label>
                      {tempPhotos[dev.id] && (
                        <div style={{ position: 'relative' }}>
                          <img src={tempPhotos[dev.id]} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '5px', border: '1px solid var(--border)' }} />
                          <button onClick={() => setTempPhotos(p => { const n = { ...p }; delete n[dev.id]; return n })}
                            style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--red)', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', color: '#fff', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                        </div>
                      )}
                    </div>

                    <button onClick={() => logTemp(dev)} disabled={saving[dev.id]}
                      className="btn-primary" style={{ width: '100%', padding: '10px' }}>
                      {saving[dev.id] ? '⏳ جاري الحفظ...' : '✅ تسجيل درجة الحرارة'}
                    </button>

                    {/* Today logs */}
                    {todayDevLogs.length > 0 && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text)', marginBottom: '4px' }}>سجل اليوم ({todayDevLogs.length} قراءة)</div>
                        {todayDevLogs.map(l => (
                          <div key={l.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '3px 0', fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: l.is_ok ? 'var(--green)' : 'var(--red)' }}>{l.temp}°C</span>
                            <span style={{ color: 'var(--muted)' }}>{l.created_at ? new Date(l.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                            <span style={{ color: 'var(--text)' }}>👤 {l.logged_by}</span>
                            {l.notes && <span style={{ color: 'var(--muted)' }}>{l.notes}</span>}
                            <span>{l.is_ok ? '✅' : '❌'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
              <input type="date" value={histDate} onChange={e => setHistDate(e.target.value)}
                style={{ padding: '8px', background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--white)', fontFamily: 'monospace', outline: 'none' }} />
              <span style={{ fontSize: '10px', color: 'var(--text)' }}>{histLogs.length} قراءة</span>
            </div>
            {histLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '11px' }}>لا توجد سجلات في هذا اليوم</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>الجهاز</th><th>الحرارة</th><th>النطاق</th><th>المسجّل</th><th>الوقت</th><th>الحالة</th></tr></thead>
                  <tbody>
                    {histLogs.map(l => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: '700' }}>{l.device_name}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: '700', color: l.is_ok ? 'var(--green)' : 'var(--red)' }}>{l.temp}°C</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '10px' }}>{l.min_ok}↔{l.max_ok}</td>
                        <td>{l.logged_by}</td>
                        <td style={{ fontSize: '10px', color: 'var(--muted)' }}>{l.created_at ? new Date(l.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) : ''}</td>
                        <td>{l.is_ok ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SETUP */}
        {tab === 'setup' && (
          <div>
            <div className="card" style={{ marginBottom: '12px' }}>
              <h3 className="card-title">{editDevId ? '✏️ تعديل جهاز' : '➕ إضافة جهاز تبريد'}</h3>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>اسم الجهاز *</label>
                  <input type="text" value={devForm.name} onChange={e => setDevForm({ ...devForm, name: e.target.value })} placeholder="مثال: ثلاجة اللحوم الرئيسية" />
                </div>
                <div className="form-group">
                  <label>الموقع</label>
                  <input type="text" value={devForm.location} onChange={e => setDevForm({ ...devForm, location: e.target.value })} placeholder="مثال: جانب الشوايات" />
                </div>
                <div className="form-group">
                  <label>النوع</label>
                  <select value={devForm.device_type} onChange={e => {
                    const type = DEVICE_TYPES.find(t => t.value === e.target.value)
                    setDevForm({ ...devForm, device_type: e.target.value, min_temp: type?.min || 0, max_temp: type?.max || 4 })
                  }}>
                    {DEVICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>🌡️ الحد الأدنى °C *</label>
                  <input type="number" value={devForm.min_temp} onChange={e => setDevForm({ ...devForm, min_temp: parseFloat(e.target.value) })} step="0.5" />
                </div>
                <div className="form-group">
                  <label>🌡️ الحد الأقصى °C *</label>
                  <input type="number" value={devForm.max_temp} onChange={e => setDevForm({ ...devForm, max_temp: parseFloat(e.target.value) })} step="0.5" />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                  <input type="checkbox" id="ccp-cb" checked={devForm.is_ccp} onChange={e => setDevForm({ ...devForm, is_ccp: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                  <label htmlFor="ccp-cb" style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--red)' }}>⚠️ نقطة تحكم حرجة (CCP)</label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button className="btn-primary" onClick={saveDevice} style={{ flex: 1 }}>{editDevId ? '💾 حفظ' : '💾 إضافة'}</button>
                {editDevId && <button onClick={() => { setEditDevId(null); setDevForm({ name: '', location: '', device_type: 'fridge', stores: 'متعدد', min_temp: -2, max_temp: 4, is_ccp: true }) }}
                  style={{ padding: '10px 14px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '7px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>إلغاء</button>}
              </div>
            </div>

            {/* Devices list */}
            {devices.map(dev => (
              <div key={dev.id} style={{ background: 'var(--card2)', border: `1px solid ${dev.is_ccp ? 'rgba(255,59,92,.2)' : 'var(--border)'}`, borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700' }}>{dev.name}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text)' }}>{dev.location} · 🌡️ {dev.min_temp}°C ← {dev.max_temp}°C {dev.is_ccp ? '· ⚠️ CCP' : ''}</div>
                  </div>
                  <button onClick={() => startEditDev(dev)} style={{ background: 'rgba(255,212,38,.1)', border: '1px solid rgba(255,212,38,.2)', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', color: 'var(--gold)', fontSize: '11px' }}>✏️</button>
                  <button onClick={() => deleteDevice(dev.id, dev.name)} style={{ background: 'rgba(255,59,92,.1)', border: '1px solid rgba(255,59,92,.2)', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer', color: 'var(--red)', fontSize: '11px' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
