import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const TITLES = ['مدير عمليات','مدير فرع','كاشير','طاهي رئيسي','طاهي','بارستا','نادل','أمين مستودع','موظف نظافة','سائق','أخرى']

export default function EmployeesPage({ session }) {
  const router = useRouter()
  const [employees, setEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('list')
  const [form, setForm] = useState({ name:'', title:'كاشير', email:'', phone:'', salary:0, join_date:'' })
  const [editId, setEditId] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!session) { router.push('/'); return }
    Promise.all([fetchData('employees'), fetchData('attendance')]).then(([e,a]) => {
      setEmployees(e.filter(i=>i.is_active!==false))
      setAttendance(a)
      setLoading(false)
    })
  }, [session])

  const save = async () => {
    if (!form.name.trim()) { alert('أدخل الاسم'); return }
    const record = { ...form, id: editId||crypto.randomUUID(), is_active:true, salary:parseFloat(form.salary)||0 }
    const saved = await saveData('employees', record)
    if (editId) setEmployees(p=>p.map(e=>e.id===editId?saved:e))
    else setEmployees(p=>[saved,...p])
    setForm({name:'',title:'كاشير',email:'',phone:'',salary:0,join_date:''})
    setEditId(null); setTab('list')
  }

  const markAttendance = async (empId, empName, status) => {
    const existing = attendance.find(a=>a.employee_id===empId&&a.date===today)
    const record = { id: existing?.id||crypto.randomUUID(), employee_id:empId, emp_name:empName, date:today, status, time_in: status==='حاضر'?new Date().toTimeString().slice(0,5):null }
    const saved = await saveData('attendance', record)
    setAttendance(p=>{
      const idx=p.findIndex(a=>a.employee_id===empId&&a.date===today)
      if(idx>=0){const n=[...p];n[idx]=saved;return n}
      return [saved,...p]
    })
  }

  const deleteEmp = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    await saveData('employees', {id, is_active:false})
    setEmployees(p=>p.filter(e=>e.id!==id))
  }

  const todayAtt = attendance.filter(a=>a.date===today)
  const presentToday = todayAtt.filter(a=>a.status==='حاضر').length
  const totalSalaries = employees.reduce((s,e)=>s+(parseFloat(e.salary)||0),0)

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{padding:'16px'}}>
        <h1 className="page-title">👥 الموظفون</h1>
        <div className="kpi-grid" style={{marginBottom:'14px'}}>
          <div className="kpi-card blue"><div className="kpi-value">{employees.length}</div><div className="kpi-label">إجمالي الموظفين</div></div>
          <div className="kpi-card green"><div className="kpi-value">{presentToday}</div><div className="kpi-label">حاضر اليوم</div></div>
          <div className="kpi-card red"><div className="kpi-value">{employees.length-presentToday}</div><div className="kpi-label">غائب / غير مسجّل</div></div>
          <div className="kpi-card"><div className="kpi-value" style={{fontSize:'13px',color:'var(--gold)'}}>{totalSalaries.toLocaleString()}</div><div className="kpi-label">إجمالي الرواتب</div></div>
        </div>

        <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'}}>
          {[['list','👥 القائمة'],['attend','✅ الحضور'],['salary','💰 الرواتب'],['add',editId?'✏️ تعديل':'➕ إضافة']].map(([id,label])=>(
            <button key={id} onClick={()=>{setTab(id);if(id==='list'){setEditId(null);setForm({name:'',title:'كاشير',email:'',phone:'',salary:0,join_date:''})}}}
              style={{padding:'8px 14px',borderRadius:'7px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:tab===id?'700':'400',background:tab===id?'rgba(201,168,76,.15)':'rgba(255,255,255,.05)',color:tab===id?'var(--gold)':'var(--text)'}}>
              {label}
            </button>
          ))}
        </div>

        {/* LIST */}
        {tab==='list' && (
          <div>
            {employees.length===0?<div style={{textAlign:'center',padding:'30px',color:'var(--muted)',fontSize:'12px'}}>لا يوجد موظفون — اضغط "+ إضافة"</div>:(
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {employees.map(emp=>{
                  const att=todayAtt.find(a=>a.employee_id===emp.id)
                  return (
                    <div key={emp.id} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'10px',padding:'12px',display:'flex',alignItems:'center',gap:'12px'}}>
                      <div style={{width:'40px',height:'40px',background:'rgba(201,168,76,.15)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',fontWeight:'700',color:'var(--gold)',flexShrink:0}}>
                        {emp.name?.[0]||'؟'}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:'700',fontSize:'13px'}}>{emp.name}</div>
                        <div style={{fontSize:'10px',color:'var(--text)'}}>{emp.title}</div>
                        <div style={{fontSize:'9px',color:'var(--muted)'}}>{emp.phone||''} {emp.email||''}</div>
                      </div>
                      <div style={{textAlign:'center',marginLeft:'8px'}}>
                        <div style={{fontFamily:'monospace',fontSize:'12px',color:'var(--green)'}}>{(emp.salary||0).toLocaleString()}</div>
                        <div style={{fontSize:'8px',color:'var(--muted)'}}>راتب/شهر</div>
                      </div>
                      <div style={{display:'flex',gap:'4px'}}>
                        <span style={{fontSize:'16px'}}>{att?.status==='حاضر'?'✅':att?.status==='غائب'?'❌':'⬜'}</span>
                        <button onClick={()=>{setForm({name:emp.name,title:emp.title,email:emp.email||'',phone:emp.phone||'',salary:emp.salary||0,join_date:emp.join_date||''});setEditId(emp.id);setTab('add')}}
                          style={{background:'rgba(255,212,38,.1)',border:'1px solid rgba(255,212,38,.2)',borderRadius:'5px',padding:'4px 8px',cursor:'pointer',color:'var(--gold)',fontSize:'11px'}}>✏️</button>
                        <button onClick={()=>deleteEmp(emp.id,emp.name)}
                          style={{background:'rgba(255,59,92,.1)',border:'1px solid rgba(255,59,92,.2)',borderRadius:'5px',padding:'4px 8px',cursor:'pointer',color:'var(--red)',fontSize:'11px'}}>🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {tab==='attend' && (
          <div>
            <div style={{marginBottom:'10px',fontSize:'12px',color:'var(--text)'}}>📅 تسجيل حضور اليوم: {today}</div>
            {employees.map(emp=>{
              const att=todayAtt.find(a=>a.employee_id===emp.id)
              return (
                <div key={emp.id} style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'10px',padding:'12px',marginBottom:'8px',display:'flex',alignItems:'center',gap:'12px'}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'700',fontSize:'13px'}}>{emp.name}</div>
                    <div style={{fontSize:'10px',color:'var(--text)'}}>{emp.title}</div>
                    {att && <div style={{fontSize:'9px',color:'var(--muted)'}}>وقت الدخول: {att.time_in||'—'}</div>}
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={()=>markAttendance(emp.id,emp.name,'حاضر')}
                      style={{padding:'7px 14px',borderRadius:'6px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',background:att?.status==='حاضر'?'var(--green)':'rgba(0,212,106,.1)',color:att?.status==='حاضر'?'#000':'var(--green)',fontWeight:att?.status==='حاضر'?'700':'400'}}>✅ حاضر</button>
                    <button onClick={()=>markAttendance(emp.id,emp.name,'غائب')}
                      style={{padding:'7px 14px',borderRadius:'6px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',background:att?.status==='غائب'?'var(--red)':'rgba(255,59,92,.1)',color:att?.status==='غائب'?'#fff':'var(--red)',fontWeight:att?.status==='غائب'?'700':'400'}}>❌ غائب</button>
                    <button onClick={()=>markAttendance(emp.id,emp.name,'إجازة')}
                      style={{padding:'7px 14px',borderRadius:'6px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'11px',background:att?.status==='إجازة'?'var(--blue)':'rgba(77,158,255,.1)',color:att?.status==='إجازة'?'#fff':'var(--blue)',fontWeight:att?.status==='إجازة'?'700':'400'}}>🏖️ إجازة</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SALARY */}
        {tab==='salary' && (
          <div>
            <div style={{background:'var(--card2)',border:'1px solid rgba(201,168,76,.2)',borderRadius:'10px',padding:'14px',marginBottom:'12px'}}>
              <div style={{fontSize:'12px',color:'var(--text)',marginBottom:'6px'}}>📊 ملخص الرواتب</div>
              <div style={{fontFamily:'monospace',fontSize:'22px',fontWeight:'900',color:'var(--gold)'}}>{totalSalaries.toLocaleString()} د.ع</div>
              <div style={{fontSize:'10px',color:'var(--muted)'}}>إجمالي الرواتب الشهرية · {employees.length} موظف</div>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead><tr><th>الموظف</th><th>المسمى</th><th>الراتب الشهري</th><th>أيام الحضور</th></tr></thead>
                <tbody>
                  {employees.map(emp=>{
                    const daysPresent=attendance.filter(a=>a.employee_id===emp.id&&a.status==='حاضر').length
                    return (
                      <tr key={emp.id}>
                        <td style={{fontWeight:'700'}}>{emp.name}</td>
                        <td style={{fontSize:'10px',color:'var(--text)'}}>{emp.title}</td>
                        <td className="bold-gold">{(emp.salary||0).toLocaleString()} د.ع</td>
                        <td>{daysPresent} يوم</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ADD/EDIT */}
        {tab==='add' && (
          <div className="card">
            <h3 className="card-title">{editId?'✏️ تعديل موظف':'➕ إضافة موظف جديد'}</h3>
            <div className="form-grid">
              <div className="form-group" style={{gridColumn:'1 / -1'}}><label>الاسم الكامل *</label>
                <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="الاسم الكامل"/>
              </div>
              <div className="form-group"><label>المسمى الوظيفي</label>
                <select value={form.title} onChange={e=>setForm({...form,title:e.target.value})}>
                  {TITLES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>الراتب الشهري (د.ع)</label>
                <input type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} min="0"/>
              </div>
              <div className="form-group"><label>رقم الهاتف</label>
                <input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="07xxxxxxxxx" dir="ltr"/>
              </div>
              <div className="form-group"><label>البريد الإلكتروني</label>
                <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com" dir="ltr"/>
              </div>
              <div className="form-group"><label>تاريخ الانضمام</label>
                <input type="date" value={form.join_date} onChange={e=>setForm({...form,join_date:e.target.value})}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button className="btn-primary" onClick={save} style={{flex:1}}>{editId?'💾 حفظ':'💾 إضافة'}</button>
              <button onClick={()=>{setTab('list');setEditId(null)}} style={{padding:'10px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text)',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
