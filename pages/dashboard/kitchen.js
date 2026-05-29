import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { fetchData, saveData } from '../../lib/supabase'
import Layout from '../../components/Layout'

const HACCP_COLORS = { CCP:'#FF3B5C', CP:'#FFD426', GMP:'#00D46A' }

export default function KitchenPage({ session }) {
  const router = useRouter()
  const [cldItems, setCldItems] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('checklist')
  const [checks, setChecks] = useState({})
  const [prodForm, setProdForm] = useState({ name:'', unit:'كغ', category:'', method:'', default_qty:0 })
  const [editProdId, setEditProdId] = useState(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!session) { router.push('/'); return }
    Promise.all([fetchData('cld_items'), fetchData('wms_catalog')]).then(([c,w])=>{
      setCldItems(c.filter(i=>i.is_active!==false))
      setCatalog(w.filter(i=>i.is_active!==false))
      setLoading(false)
    })
  }, [session])

  const toggleCheck = (id) => {
    setChecks(p=>({...p,[id]:!p[id]}))
  }

  const checkedCount = Object.values(checks).filter(Boolean).length
  const pct = cldItems.length ? Math.round(checkedCount/cldItems.length*100) : 0

  const saveProd = async () => {
    if (!prodForm.name.trim()) { alert('أدخل الاسم'); return }
    const record = { ...prodForm, id: editProdId||crypto.randomUUID(), is_active:true, stock:prodForm.default_qty||0, min_stock:5 }
    const saved = await saveData('wms_catalog', record)
    if (editProdId) setCatalog(p=>p.map(i=>i.id===editProdId?saved:i))
    else setCatalog(p=>[saved,...p])
    setProdForm({name:'',unit:'كغ',category:'',method:'',default_qty:0})
    setEditProdId(null)
    setTab('catalog')
  }

  if (loading) return <Layout session={session}><div className="loading-screen"><div>⏳</div></div></Layout>

  return (
    <Layout session={session}>
      <div style={{padding:'16px'}}>
        <h1 className="page-title">🏭 المطبخ المركزي</h1>

        <div style={{display:'flex',gap:'6px',marginBottom:'12px',flexWrap:'wrap'}}>
          {[['checklist','✅ جك لاين اليومي'],['catalog','📚 كتالوج الإنتاج'],['transfer','🔄 نقل بين المطابخ']].map(([id,label])=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{padding:'8px 14px',borderRadius:'7px',border:'none',cursor:'pointer',fontFamily:'Cairo,sans-serif',fontSize:'12px',fontWeight:tab===id?'700':'400',background:tab===id?'rgba(201,168,76,.15)':'rgba(255,255,255,.05)',color:tab===id?'var(--gold)':'var(--text)'}}>
              {label}
            </button>
          ))}
        </div>

        {/* CHECKLIST */}
        {tab==='checklist' && (
          <div>
            {/* Progress */}
            <div style={{background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'10px',padding:'14px',marginBottom:'12px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontSize:'12px',fontWeight:'700'}}>تقدم الجك لاين</span>
                <span style={{fontFamily:'monospace',fontSize:'14px',fontWeight:'900',color:pct===100?'var(--green)':'var(--gold)'}}>{checkedCount}/{cldItems.length}</span>
              </div>
              <div style={{height:'8px',background:'rgba(255,255,255,.08)',borderRadius:'4px',overflow:'hidden'}}>
                <div style={{height:'100%',width:pct+'%',background:pct===100?'var(--green)':'var(--gold)',borderRadius:'4px',transition:'width .3s'}}/>
              </div>
              <div style={{fontSize:'9px',color:'var(--muted)',marginTop:'4px'}}>{today}</div>
            </div>

            {cldItems.length===0?(
              <div style={{textAlign:'center',padding:'30px',color:'var(--muted)',fontSize:'12px'}}>
                لا توجد أصناف — أضف من صفحة <strong>جك لاين</strong>
              </div>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
                {cldItems.map(item=>(
                  <div key={item.id} onClick={()=>toggleCheck(item.id)}
                    style={{background:checks[item.id]?'rgba(0,212,106,.08)':'var(--card2)',border:`1px solid ${checks[item.id]?'rgba(0,212,106,.3)':'var(--border)'}`,borderRadius:'10px',padding:'12px',cursor:'pointer',display:'flex',alignItems:'center',gap:'12px',transition:'all .2s'}}>
                    <div style={{width:'24px',height:'24px',borderRadius:'50%',border:`2px solid ${checks[item.id]?'var(--green)':'var(--border)'}`,background:checks[item.id]?'var(--green)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'}}>
                      {checks[item.id]&&<span style={{color:'#000',fontSize:'12px',fontWeight:'900'}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:'700',fontSize:'12px',textDecoration:checks[item.id]?'line-through':'none',color:checks[item.id]?'var(--muted)':'var(--white)'}}>{item.name}</div>
                      <div style={{fontSize:'9px',color:'var(--text)',display:'flex',gap:'8px',marginTop:'2px',flexWrap:'wrap'}}>
                        <span style={{padding:'1px 6px',borderRadius:'3px',background:`${HACCP_COLORS[item.haccp_level]}22`,color:HACCP_COLORS[item.haccp_level]||'var(--text)'}}>{item.haccp_level}</span>
                        {item.min_temp&&<span>🌡️ {item.min_temp}</span>}
                        {item.shelf_life>0&&<span>📅 {item.shelf_life}د</span>}
                        {item.has_allergen&&<span style={{color:'var(--orange)'}}>⚠️</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pct===100&&(
              <div style={{marginTop:'12px',background:'rgba(0,212,106,.1)',border:'1px solid rgba(0,212,106,.3)',borderRadius:'10px',padding:'14px',textAlign:'center'}}>
                <div style={{fontSize:'24px',marginBottom:'4px'}}>✅</div>
                <div style={{fontWeight:'700',color:'var(--green)'}}>جك لاين مكتمل!</div>
                <div style={{fontSize:'10px',color:'var(--text)',marginTop:'3px'}}>تم التحقق من جميع الأصناف</div>
              </div>
            )}
          </div>
        )}

        {/* CATALOG */}
        {tab==='catalog' && (
          <div>
            <button onClick={()=>{setEditProdId(null);setProdForm({name:'',unit:'كغ',category:'',method:'',default_qty:0});setTab('add-prod')}}
              className="btn-primary" style={{marginBottom:'12px',fontSize:'12px'}}>+ إضافة صنف للكتالوج</button>
            {catalog.length===0?(
              <div style={{textAlign:'center',padding:'20px',color:'var(--muted)',fontSize:'12px'}}>كتالوج فارغ — أضف أصنافك</div>
            ):(
              <div className="table-container">
                <table className="data-table">
                  <thead><tr><th>الصنف</th><th>الفئة</th><th>الوحدة</th><th>المخزون</th><th>طريقة التحضير</th><th></th></tr></thead>
                  <tbody>
                    {catalog.map(item=>(
                      <tr key={item.id}>
                        <td style={{fontWeight:'700'}}>{item.name}</td>
                        <td style={{fontSize:'10px',color:'var(--text)'}}>{item.category||'—'}</td>
                        <td>{item.unit}</td>
                        <td style={{fontFamily:'monospace'}}>{item.stock||0}</td>
                        <td style={{fontSize:'10px',color:'var(--muted)',maxWidth:'150px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.method||'—'}</td>
                        <td>
                          <button onClick={()=>{setProdForm({name:item.name,unit:item.unit||'كغ',category:item.category||'',method:item.method||'',default_qty:item.stock||0});setEditProdId(item.id);setTab('add-prod')}}
                            style={{background:'rgba(255,212,38,.1)',border:'1px solid rgba(255,212,38,.2)',borderRadius:'4px',padding:'4px 8px',cursor:'pointer',color:'var(--gold)',fontSize:'11px'}}>✏️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ADD PROD */}
        {tab==='add-prod' && (
          <div className="card">
            <h3 className="card-title">{editProdId?'✏️ تعديل':'➕ إضافة للكتالوج'}</h3>
            <div className="form-grid">
              <div className="form-group" style={{gridColumn:'1/-1'}}><label>اسم الصنف *</label>
                <input type="text" value={prodForm.name} onChange={e=>setProdForm({...prodForm,name:e.target.value})} placeholder="مثال: صوص البركر الخاص"/>
              </div>
              <div className="form-group"><label>الفئة</label>
                <input type="text" value={prodForm.category} onChange={e=>setProdForm({...prodForm,category:e.target.value})} placeholder="مثال: صلصات"/>
              </div>
              <div className="form-group"><label>الوحدة</label>
                <select value={prodForm.unit} onChange={e=>setProdForm({...prodForm,unit:e.target.value})}>
                  {['كغ','غم','لتر','مل','حبة','علبة','وعاء'].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group"><label>الكمية الافتراضية اليومية</label>
                <input type="number" value={prodForm.default_qty} onChange={e=>setProdForm({...prodForm,default_qty:parseFloat(e.target.value)||0})} min="0" step="0.1"/>
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}><label>طريقة التحضير</label>
                <textarea value={prodForm.method} onChange={e=>setProdForm({...prodForm,method:e.target.value})} placeholder="خطوات التحضير..." rows="3"
                  style={{width:'100%',padding:'8px',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--white)',fontFamily:'Cairo,sans-serif',fontSize:'12px',outline:'none',resize:'vertical'}}/>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px',marginTop:'4px'}}>
              <button className="btn-primary" onClick={saveProd} style={{flex:1}}>💾 حفظ</button>
              <button onClick={()=>setTab('catalog')} style={{padding:'10px 16px',background:'transparent',border:'1px solid var(--border)',borderRadius:'7px',color:'var(--text)',cursor:'pointer',fontFamily:'Cairo,sans-serif'}}>إلغاء</button>
            </div>
          </div>
        )}

        {/* TRANSFER */}
        {tab==='transfer' && (
          <div>
            <div style={{background:'var(--card2)',border:'1px solid rgba(77,158,255,.2)',borderRadius:'10px',padding:'16px',textAlign:'center'}}>
              <div style={{fontSize:'32px',marginBottom:'8px'}}>🔄</div>
              <div style={{fontWeight:'700',marginBottom:'4px'}}>نقل بين المطابخ</div>
              <div style={{fontSize:'10px',color:'var(--text)',marginBottom:'12px'}}>نقل أصناف من المطبخ المركزي للمطبخ الفرعي</div>
              <div className="form-group" style={{textAlign:'right'}}><label>الصنف</label>
                <select style={{width:'100%',padding:'8px',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--white)',fontFamily:'Cairo,sans-serif',outline:'none'}}>
                  <option value="">— اختر الصنف —</option>
                  {catalog.map(i=><option key={i.id} value={i.id}>{i.name} ({i.stock||0} {i.unit})</option>)}
                </select>
              </div>
              <div className="form-group" style={{textAlign:'right'}}><label>الكمية</label>
                <input type="number" min="0.1" step="0.1" placeholder="0"
                  style={{width:'100%',padding:'8px',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--white)',fontFamily:'monospace',fontSize:'14px',outline:'none'}}/>
              </div>
              <div className="form-group" style={{textAlign:'right'}}><label>الوجهة</label>
                <select style={{width:'100%',padding:'8px',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:'6px',color:'var(--white)',fontFamily:'Cairo,sans-serif',outline:'none'}}>
                  <option>مطبخ الخدمة</option><option>البار</option><option>الصالة</option>
                </select>
              </div>
              <button className="btn-primary" style={{width:'100%',padding:'11px'}}>✅ تسجيل النقل</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
