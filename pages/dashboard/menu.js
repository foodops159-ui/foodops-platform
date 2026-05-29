import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const CATS = ['برغر','سناك','فرايز','باستا','بيتزا','ريزو','بايتس','سلطة','صناديق','حلويات','مشروبات ساخنة','مشروبات باردة','عصائر']

export default function MenuPage({ session }) {
  const router = useRouter()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('menu')
  const [form, setForm] = useState({ name:'', name_en:'', cat:'برغر', price:0, cost:0, sales:100, is_active:true })
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!session) { router.push('/'); return }
    loadMenu()
  }, [session])

  const loadMenu = async () => {
    const { data: ru } = await supabase.from('restaurant_users').select('restaurant_id').eq('user_id', session.user.id).single()
    if (!ru) return
    const { data } = await supabase.from('menu_items').select('*').eq('restaurant_id', ru.restaurant_id).order('cat')
    setItems(data||[])
    setLoading(false)
  }

  const save = async () => {
    if (!form.name.trim()) { alert('أدخل الاسم'); return }
    try {
      const record = { ...form, id: editId||crypto.randomUUID(), price: parseFloat(form.price)||0, cost: parseFloat(form.cost)||0, sales: parseInt(form.sales)||0 }
      const saved = await saveData('menu_items', record)
      if (editId) setItems(p=>p.map(i=>i.id===editId?saved:i))
      else setItems(p=>[...p,saved])
      setForm({name:'',name_en:'',cat:'برغر',price:0,cost:0,sales:100,is_active:true})
      setEditId(null); setTab('menu')
    } catch(e) { alert('خطأ: '+e.message) }
  }

  const deleteItem = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    await saveData('menu_items', {id, is_active:false})
    setItems(p=>p.filter(i=>i.id!==id))
  }

  const filtered = items.filter(i=>i.is_active!==false&&(!search||i.name.includes(search)||i.cat.includes(search)))

  // BCG Matrix
  const avgSales = items.length ? items.reduce((s,i)=>s+(i.sales||0),0)/items.length : 50
  const avgMargin = items.length ? items.reduce((s,i)=>s+(i.price-i.cost),0)/items.length : 5000
  const bcgClass = (item) => {
    const highSales = (item.sales||0) >= avgSales
    const highMargin = (item.price-item.cost) >= avgMargin
    if (highSales && highMargin) return { label:'⭐ Star', color:'var(--gold)' }
    if (!highSales && highMargin) return { label:'🧩 Puzzle', color:'var(--blue)' }
    if (highSales && !highMargin) return { label:'🐄 Plow Horse', color:'var(--green)' }
    return { label:'🐕 Dog', color:'var(--red)' }
  }

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{padding:'16px'}}>
        <h1 className="page-title">🍽️ هندسة المنيو</h1>

        <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'}}>
          {[['menu','📋 القائمة'],['bcg','📊 BCG Matrix'],['add',editId?'✏️ تعديل':'➕ إضافة']].map(([id,label])=>(
            <button key={id} onClick={()=>{setTab(id);if(id==='menu'){setEditId(null)}}}
              style={{padding:'8px 14px',borderRadius:'7px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:tab===id?'700':'400',background:tab===id?'rgba(201,168,76,.15)':'rgba(255,255,255,.05)',color:tab===id?'var(--gold)':'var(--text)'}}>
              {label}
            </button>
          ))}
        </div>

        {/* MENU */}
        {tab==='menu' && (
          <div>
            <div style={{display:'flex',gap:'8px',marginBottom:'10px'}}>
              <input type="text" placeholder="بحث..." value={search} onChange={e=>setSearch(e.target.value)}
                style={{flex:1,padding:'8px',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--white)',fontFamily:'Cairo,sans-serif',outline:'none'}}/>
              <button onClick={()=>setTab('add')} className="btn-primary" style={{fontSize:'12px',padding:'8px 14px'}}>+ إضافة</button>
            </div>
            {items.length===0?(
              <div style={{textAlign:'center',padding:'30px',color:'var(--muted)',fontSize:'12px'}}>القائمة فارغة — أضف أصنافك</div>
            ):(
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>الصنف</th><th>الفئة</th><th>السعر</th><th>الكوست</th><th>الهامش</th><th>المبيعات</th><th></th></tr></thead>
                  <tbody>
                    {filtered.map(item=>{
                      const margin = (item.price||0)-(item.cost||0)
                      const marginPct = item.price>0?Math.round(margin/item.price*100):0
                      return (
                        <tr key={item.id}>
                          <td><div style={{fontWeight:'700'}}>{item.name}</div><div style={{fontSize:'9px',color:'var(--muted)'}}>{item.name_en}</div></td>
                          <td style={{fontSize:'10px',color:'var(--text)'}}>{item.cat}</td>
                          <td style={{fontFamily:'monospace',color:'var(--gold)'}}>{(item.price||0).toLocaleString()}</td>
                          <td style={{fontFamily:'monospace',color:'var(--red)'}}>{(item.cost||0).toLocaleString()}</td>
                          <td style={{fontFamily:'monospace',color:marginPct>=65?'var(--green)':'var(--yellow)'}}>{marginPct}%</td>
                          <td>{item.sales||0}</td>
                          <td>
                            <div style={{display:'flex',gap:'4px'}}>
                              <button onClick={()=>{setForm({name:item.name,name_en:item.name_en||'',cat:item.cat,price:item.price||0,cost:item.cost||0,sales:item.sales||100,is_active:true});setEditId(item.id);setTab('add')}}
                                style={{background:'rgba(255,212,38,.1)',border:'1px solid rgba(255,212,38,.2)',borderRadius:'4px',padding:'4px 8px',cursor:'pointer',color:'var(--gold)',fontSize:'11px'}}>✏️</button>
                              <button onClick={()=>deleteItem(item.id,item.name)}
                                style={{background:'rgba(255,59,92,.1)',border:'1px solid rgba(255,59,92,.2)',borderRadius:'4px',padding:'4px 8px',cursor:'pointer',color:'var(--red)',fontSize:'11px'}}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* BCG */}
        {tab==='bcg' && (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'12px'}}>
              {[{label:'⭐ Stars',color:'var(--gold)',desc:'مبيعات عالية + هامش عالٍ'},
                {label:'🧩 Puzzles',color:'var(--blue)',desc:'مبيعات منخفضة + هامش عالٍ'},
                {label:'🐄 Plow Horses',color:'var(--green)',desc:'مبيعات عالية + هامش منخفض'},
                {label:'🐕 Dogs',color:'var(--red)',desc:'مبيعات منخفضة + هامش منخفض'}].map(c=>(
                <div key={c.label} style={{background:'var(--card2)',border:`1px solid ${c.color}33`,borderRadius:'8px',padding:'10px'}}>
                  <div style={{fontWeight:'700',fontSize:'12px',color:c.color,marginBottom:'3px'}}>{c.label}</div>
                  <div style={{fontSize:'9px',color:'var(--text)',marginBottom:'6px'}}>{c.desc}</div>
                  <div style={{fontSize:'11px',fontFamily:'monospace',color:'var(--white)'}}>
                    {items.filter(i=>i.is_active!==false&&bcgClass(i).label===c.label).length} صنف
                  </div>
                </div>
              ))}
            </div>
            {items.filter(i=>i.is_active!==false).map(item=>{
              const bcg=bcgClass(item)
              return (
                <div key={item.id} style={{background:'var(--card2)',border:`1px solid ${bcg.color}33`,borderRadius:'8px',padding:'10px',marginBottom:'6px',display:'flex',alignItems:'center',gap:'10px'}}>
                  <div style={{flex:1}}>
                    <span style={{fontWeight:'700',fontSize:'12px'}}>{item.name}</span>
                    <span style={{fontSize:'10px',color:'var(--text)',marginRight:'8px'}}>{item.cat}</span>
                  </div>
                  <span style={{fontSize:'10px',padding:'2px 8px',borderRadius:'4px',background:`${bcg.color}22`,color:bcg.color,fontWeight:'700'}}>{bcg.label}</span>
                  <span style={{fontFamily:'monospace',fontSize:'11px',color:'var(--gold)'}}>{(item.price||0).toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* ADD */}
        {tab==='add' && (
          <div className="card">
            <h3 className="card-title">{editId?'✏️ تعديل':'➕ إضافة صنف'}</h3>
            <div className="form-grid">
              <div className="form-group"><label>الاسم عربي *</label><input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="مثال: مايند بركر"/></div>
              <div className="form-group"><label>الاسم إنجليزي</label><input type="text" value={form.name_en} onChange={e=>setForm({...form,name_en:e.target.value})} placeholder="Mind Burger" dir="ltr"/></div>
              <div className="form-group"><label>الفئة</label>
                <select value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group"><label>السعر (د.ع)</label><input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} min="0"/></div>
              <div className="form-group"><label>التكلفة (د.ع)</label><input type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} min="0"/></div>
              <div className="form-group"><label>المبيعات الشهرية (وحدة)</label><input type="number" value={form.sales} onChange={e=>setForm({...form,sales:e.target.value})} min="0"/></div>
            </div>
            {form.price>0&&form.cost>0&&(
              <div style={{background:'rgba(201,168,76,.08)',border:'1px solid rgba(201,168,76,.2)',borderRadius:'6px',padding:'8px',marginBottom:'10px',fontSize:'11px'}}>
                هامش الربح: <strong style={{color:'var(--gold)'}}>{Math.round((form.price-form.cost)/form.price*100)}%</strong> ({(form.price-form.cost).toLocaleString()} د.ع/وحدة)
              </div>
            )}
            <div style={{display:'flex',gap:'8px'}}>
              <button className="btn-primary" onClick={save} style={{flex:1}}>💾 حفظ</button>
              <button onClick={()=>{setTab('menu');setEditId(null)}} style={{padding:'10px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text)',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>إلغاء</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
