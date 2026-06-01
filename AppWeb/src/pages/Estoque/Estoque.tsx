import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Search, Calendar, AlertCircle, List, LayoutGrid, ArrowLeft, Plus, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'
import styles from './Estoque.module.css'

interface Product {
  id: number
  code: string
  name: string
  position: string
  entryDate: string
  valDate: string
  qty: number
}

const mockInventory: Product[] = [
  { id: 1, code: 'HW-001', name: 'Microcontrolador ESP32',       position: '1A1', entryDate: '2026-04-10', valDate: 'N/A',        qty: 150 },
  { id: 2, code: 'SN-022', name: 'Sensor Ultrassônico HC-SR04',  position: '1A3', entryDate: '2026-04-15', valDate: 'N/A',        qty: 80  },
  { id: 3, code: 'CH-105', name: 'Resina Epóxi (Litro)',         position: '1B2', entryDate: '2026-03-20', valDate: '2027-03-20', qty: 15  },
  { id: 4, code: 'BT-900', name: 'Bateria Li-Po 3S',             position: '1C4', entryDate: '2026-04-01', valDate: '2028-01-01', qty: 30  },
]

const shelfPositions = [
  '1C1','1C2','1C3','1C4',
  '1B1','1B2','1B3','1B4',
  '1A1','1A2','1A3','1A4',
]

// ─── Modal Entrada ────────────────────────────────────────────────────────────
function ModalEntrada({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ produto: '', quantidade: '', posicao: '', fornecedor: '', nf: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const handle = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  const submit = () => {
    if (!form.produto || !form.quantidade || !form.posicao) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setSuccess(true) }, 1200)
  }
  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'#0d2e22', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ArrowDownCircle size={18} color="#10b981" />
            </div>
            <h2 style={{ margin:0, fontSize:17, color:'#f3f4f6' }}>Registrar Entrada</h2>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        {success ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p style={{ color:'#10b981', fontWeight:600, fontSize:15, margin:0 }}>Entrada registrada com sucesso!</p>
            <button onClick={onClose} style={{ ...btnPrimary, marginTop:20, background:'#10b981' }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={labelStyle}>Produto *</label>
                <select style={inputStyle} value={form.produto} onChange={e => handle('produto', e.target.value)}>
                  <option value="">Selecionar...</option>
                  {mockInventory.map(p => <option key={p.id} value={p.code}>{p.code} — {p.name}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={labelStyle}>Quantidade *</label>
                <input style={inputStyle} type="number" min={1} placeholder="0" value={form.quantidade} onChange={e => handle('quantidade', e.target.value)} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={labelStyle}>Posição *</label>
                <input style={inputStyle} type="text" placeholder="Ex: 1A1" value={form.posicao} onChange={e => handle('posicao', e.target.value)} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={labelStyle}>Fornecedor</label>
                <input style={inputStyle} type="text" placeholder="Nome do fornecedor" value={form.fornecedor} onChange={e => handle('fornecedor', e.target.value)} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, gridColumn:'span 2' }}>
                <label style={labelStyle}>Nota fiscal</label>
                <input style={inputStyle} type="text" placeholder="Nº da NF" value={form.nf} onChange={e => handle('nf', e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={submit} disabled={loading} style={{ ...btnPrimary, background:'#10b981', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Enviando...' : 'Confirmar entrada'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal Saída ──────────────────────────────────────────────────────────────
function ModalSaida({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ produto: '', quantidade: '', motivo: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const handle = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))
  const submit = () => {
    if (!form.produto || !form.quantidade) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setSuccess(true) }, 1200)
  }
  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:8, background:'#2d0f0f', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <ArrowUpCircle size={18} color="#f87171" />
            </div>
            <h2 style={{ margin:0, fontSize:17, color:'#f3f4f6' }}>Registrar Saída</h2>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        {success ? (
          <div style={{ textAlign:'center', padding:'32px 0' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
            <p style={{ color:'#10b981', fontWeight:600, fontSize:15, margin:0 }}>Saída registrada com sucesso!</p>
            <button onClick={onClose} style={{ ...btnPrimary, marginTop:20, background:'#10b981' }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={labelStyle}>Produto *</label>
                <select style={inputStyle} value={form.produto} onChange={e => handle('produto', e.target.value)}>
                  <option value="">Selecionar...</option>
                  {mockInventory.map(p => <option key={p.id} value={p.code}>{p.code} — {p.name} ({p.qty} un.)</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={labelStyle}>Quantidade *</label>
                <input style={inputStyle} type="number" min={1} placeholder="0" value={form.quantidade} onChange={e => handle('quantidade', e.target.value)} />
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6, gridColumn:'span 2' }}>
                <label style={labelStyle}>Motivo</label>
                <select style={inputStyle} value={form.motivo} onChange={e => handle('motivo', e.target.value)}>
                  <option value="">Selecionar...</option>
                  <option>Venda</option>
                  <option>Uso interno</option>
                  <option>Devolução ao fornecedor</option>
                  <option>Avaria / Descarte</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={submit} disabled={loading} style={{ ...btnPrimary, background:'#ef4444', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Enviando...' : 'Confirmar saída'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const overlay:     React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }
const modal:       React.CSSProperties = { background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:16, padding:28, width:'100%', maxWidth:520 }
const modalHeader: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }
const closeBtn:    React.CSSProperties = { background:'transparent', border:'none', color:'#6b7280', cursor:'pointer', padding:4 }
const labelStyle:  React.CSSProperties = { fontSize:12, color:'#9ca3af', fontWeight:500 }
const inputStyle:  React.CSSProperties = { background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:8, padding:'8px 12px', color:'#f3f4f6', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' }
const btnPrimary:  React.CSSProperties = { padding:'9px 20px', borderRadius:8, border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }
const btnSecondary:React.CSSProperties = { padding:'9px 20px', borderRadius:8, border:'1px solid #3a3a3a', background:'transparent', color:'#9ca3af', fontSize:13, cursor:'pointer' }

// ─── Página ───────────────────────────────────────────────────────────────────
export default function Estoque() {
  const navigate = useNavigate()
  const [viewMode, setViewMode]             = useState<'list' | 'matrix'>('list')
  const [modal, setModal]                   = useState<'entrada' | 'saida' | null>(null)
  const [search, setSearch]                 = useState('')
  const [filterEntry, setFilterEntry]       = useState('')
  const [filterVal, setFilterVal]           = useState('')
  const [selectedPallet, setSelectedPallet] = useState<Product | null>(null)

  const filtered = mockInventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        item.code.toLowerCase().includes(search.toLowerCase())
    const matchEntry  = filterEntry ? item.entryDate === filterEntry : true
    const matchVal    = filterVal   ? item.valDate   === filterVal   : true
    return matchSearch && matchEntry && matchVal
  })

  const handleExtract = (item: Product) => {
    alert(`Ordem de extração enviada: Posição ${item.position} — ${item.name}`)
  }

  return (
    <div className={styles.page}>

      {/* Topbar */}
      <div className={styles.topbar}>
        <h1 className={styles.pageTitle}>Produtos</h1>
      </div>

      {/* Card principal */}
      <div className={styles.card}>

        {/* Barra de ações */}
        <div className={styles.actionBar}>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={16} /> Voltar ao início
          </button>
          <div className={styles.rightActions}>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} /> Lista
              </button>
              <button
                className={`${styles.toggleBtn} ${viewMode === 'matrix' ? styles.toggleActive : ''}`}
                onClick={() => setViewMode('matrix')}
              >
                <LayoutGrid size={16} /> Matriz
              </button>
            </div>
            <button className={styles.newBtn}>
              <Plus size={16} /> Novo produto
            </button>
          </div>
        </div>

        {/* Cards de ação */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {[
            { type:'entrada' as const, icon:ArrowDownCircle, iconColor:'#10b981', bg:'#0d2e22', border:'#065f46', hoverBorder:'#10b981', title:'Registrar Entrada', desc:'Adicionar produto ao estoque', titleColor:'#6ee7b7', descColor:'#34d399' },
            { type:'saida'   as const, icon:ArrowUpCircle,   iconColor:'#f87171', bg:'#2d0f0f', border:'#7f1d1d', hoverBorder:'#ef4444', title:'Registrar Saída',   desc:'Retirar produto do estoque',  titleColor:'#fca5a5', descColor:'#f87171' },
          ].map(({ type, icon: Icon, iconColor, bg, border, hoverBorder, title, desc, titleColor, descColor }) => (
            <button key={type} onClick={() => setModal(type)}
              style={{ background:'#1e1e1e', border:`1px solid ${border}`, borderRadius:10, padding:'14px 18px', cursor:'pointer', textAlign:'left', transition:'all 0.2s', display:'flex', alignItems:'center', gap:14 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = hoverBorder; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
              <div style={{ width:38, height:38, borderRadius:8, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={iconColor} />
              </div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:titleColor }}>{title}</div>
                <div style={{ fontSize:12, color:descColor, marginTop:2 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── LISTA ── */}
        {viewMode === 'list' && (
          <div className={styles.inventoryCard}>
            <div className={styles.filters}>
              <div className={styles.inputGroup}>
                <Search size={16} color="#9ca3af" />
                <input type="text" placeholder="Buscar por nome ou código..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className={styles.inputGroup} style={{ flex: '0 1 220px' }}>
                <Calendar size={16} color="#9ca3af" />
                <input type="date" value={filterEntry} onChange={e => setFilterEntry(e.target.value)} />
              </div>
              <div className={styles.inputGroup} style={{ flex: '0 1 220px' }}>
                <AlertCircle size={16} color="#9ca3af" />
                <input type="date" value={filterVal} onChange={e => setFilterVal(e.target.value)} />
              </div>
            </div>

            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Posição</th>
                  <th>Entrada</th>
                  <th>Validade</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className={styles.empty}>Nenhum produto encontrado.</td></tr>
                ) : filtered.map(item => (
                  <tr key={item.id} className={styles.row}>
                    <td className={styles.codeCell}>{item.code}</td>
                    <td>{item.name}</td>
                    <td><span className={styles.positionBadge}>{item.position}</span></td>
                    <td>{item.entryDate}</td>
                    <td>{item.valDate}</td>
                    <td>
                      <button className={styles.extractBtn} onClick={() => handleExtract(item)}>
                        Extrair
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── MATRIZ ── */}
        {viewMode === 'matrix' && (
          <div className={styles.inventoryCard}>
            <div className={styles.matrixWrapper}>
              <div className={styles.rack}>
                {shelfPositions.map(pos => {
                  const item = mockInventory.find(i => i.position === pos)
                  return item ? (
                    <div
                      key={pos}
                      className={`${styles.slot} ${selectedPallet?.id === item.id ? styles.slotSelected : ''}`}
                      onClick={() => setSelectedPallet(item)}
                    >
                      <span className={styles.slotLabel}>{pos}</span>
                      <Package size={36} color="#d4a04a" />
                      <span className={styles.slotCode}>{item.code}</span>
                    </div>
                  ) : (
                    <div key={pos} className={`${styles.slot} ${styles.slotEmpty}`}>
                      <span className={styles.slotLabel}>{pos}</span>
                      <span className={styles.slotEmptyText}>Vazio</span>
                    </div>
                  )
                })}
              </div>

              <div className={styles.detailsPanel}>
                {selectedPallet ? (
                  <>
                    <h3 className={styles.detailsTitle}>Detalhes do pallet</h3>
                    {([
                      ['Posição',    selectedPallet.position],
                      ['Código',     selectedPallet.code],
                      ['Produto',    selectedPallet.name],
                      ['Quantidade', `${selectedPallet.qty} un.`],
                      ['Entrada',    selectedPallet.entryDate],
                      ['Validade',   selectedPallet.valDate],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className={styles.detailsRow}>
                        <span>{k}</span><strong>{v}</strong>
                      </div>
                    ))}
                    <button
                      className={styles.extractBtn}
                      style={{ width: '100%', marginTop: '1.5rem', padding: '0.875rem' }}
                      onClick={() => handleExtract(selectedPallet)}
                    >
                      Solicitar extração autônoma
                    </button>
                  </>
                ) : (
                  <p className={styles.detailsEmpty}>
                    Selecione um pallet na prateleira para ver os detalhes.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {modal === 'entrada' && <ModalEntrada onClose={() => setModal(null)} />}
      {modal === 'saida'   && <ModalSaida   onClose={() => setModal(null)} />}
    </div>
  )
}