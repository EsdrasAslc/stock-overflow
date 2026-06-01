import { useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Package, X, Bot, Activity } from 'lucide-react'

interface Product {
  id: number
  code: string
  name: string
  position: string
  entryDate: string
  valDate: string
  qty: number
}

const mockProdutos: Product[] = [
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
            <p style={{ color:'#6b7280', fontSize:13, marginTop:6 }}>O robô foi acionado para guardar o produto.</p>
            <button onClick={onClose} style={{ ...btnPrimary, marginTop:20, background:'#10b981' }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={formGrid}>
              <div style={formGroup}>
                <label style={labelStyle}>Produto *</label>
                <select style={inputStyle} value={form.produto} onChange={e => handle('produto', e.target.value)}>
                  <option value="">Selecionar...</option>
                  {mockProdutos.map(p => <option key={p.id} value={p.code}>{p.code} — {p.name}</option>)}
                </select>
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Quantidade *</label>
                <input style={inputStyle} type="number" min={1} placeholder="0"
                  value={form.quantidade} onChange={e => handle('quantidade', e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Posição de destino *</label>
                <input style={inputStyle} type="text" placeholder="Ex: 1A1"
                  value={form.posicao} onChange={e => handle('posicao', e.target.value)} />
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Fornecedor</label>
                <input style={inputStyle} type="text" placeholder="Nome do fornecedor"
                  value={form.fornecedor} onChange={e => handle('fornecedor', e.target.value)} />
              </div>
              <div style={{ ...formGroup, gridColumn:'span 2' }}>
                <label style={labelStyle}>Nota fiscal</label>
                <input style={inputStyle} type="text" placeholder="Nº da NF"
                  value={form.nf} onChange={e => handle('nf', e.target.value)} />
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={submit} disabled={loading}
                style={{ ...btnPrimary, background:'#10b981', opacity: loading ? 0.7 : 1 }}>
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
function ModalSaida({ onClose, produto }: { onClose: () => void; produto: Product | null }) {
  const [form, setForm] = useState({ produto: produto?.code || '', quantidade: '', motivo: '' })
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
            <p style={{ color:'#6b7280', fontSize:13, marginTop:6 }}>O robô foi acionado para retirar o produto.</p>
            <button onClick={onClose} style={{ ...btnPrimary, marginTop:20, background:'#10b981' }}>Fechar</button>
          </div>
        ) : (
          <>
            <div style={formGrid}>
              <div style={formGroup}>
                <label style={labelStyle}>Produto *</label>
                <select style={inputStyle} value={form.produto} onChange={e => handle('produto', e.target.value)}>
                  <option value="">Selecionar...</option>
                  {mockProdutos.map(p => <option key={p.id} value={p.code}>{p.code} — {p.name} ({p.qty} un.)</option>)}
                </select>
              </div>
              <div style={formGroup}>
                <label style={labelStyle}>Quantidade *</label>
                <input style={inputStyle} type="number" min={1} placeholder="0"
                  value={form.quantidade} onChange={e => handle('quantidade', e.target.value)} />
              </div>
              <div style={{ ...formGroup, gridColumn:'span 2' }}>
                <label style={labelStyle}>Motivo</label>
                <select style={inputStyle} value={form.motivo} onChange={e => handle('motivo', e.target.value)}>
                  <option value="">Selecionar...</option>
                  <option>Venda</option>
                  <option>Uso interno</option>
                  <option>Devolução ao fornecedor</option>
                  <option>Avaria / Descarte</option>
                  <option>Transferência</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={submit} disabled={loading}
                style={{ ...btnPrimary, background:'#ef4444', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Enviando...' : 'Confirmar saída'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Movimentacao() {
  const [modal, setModal]                   = useState<'entrada' | 'saida' | null>(null)
  const [selectedPallet, setSelectedPallet] = useState<Product | null>(null)

  const openSaida = (produto: Product) => {
    setSelectedPallet(produto)
    setModal('saida')
  }

  return (
    <div style={{ background:'#1e1e1e', minHeight:'100vh', padding:24, fontFamily:"'Inter', sans-serif", color:'#f3f4f6' }}>

      <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Movimentação</h1>
      <p style={{ margin:'0 0 20px', fontSize:13, color:'#6b7280' }}>Registre entradas e saídas do estoque</p>

      {/* Status do robô */}
      <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:'16px 20px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Bot size={18} color="#d4a04a" />
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'#f3f4f6' }}>Telemetria do Robô</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>Aguardando comando...</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, fontWeight:700, color:'#9ca3af' }}>STANDBY</span>
          <div style={{ width:10, height:10, borderRadius:'50%', background:'#4b5563' }} />
        </div>
      </div>

      {/* Cards de ação */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
        {[
          { type: 'entrada' as const, icon: ArrowDownCircle, iconColor:'#10b981', bg:'#0d2e22', border:'#065f46', hoverBorder:'#10b981', title:'Registrar Entrada', desc:'Adicionar produto ao estoque', titleColor:'#6ee7b7', descColor:'#34d399' },
          { type: 'saida'   as const, icon: ArrowUpCircle,   iconColor:'#f87171', bg:'#2d0f0f', border:'#7f1d1d', hoverBorder:'#ef4444', title:'Registrar Saída',   desc:'Retirar produto do estoque',  titleColor:'#fca5a5', descColor:'#f87171' },
        ].map(({ type, icon: Icon, iconColor, bg, border, hoverBorder, title, desc, titleColor, descColor }) => (
          <button key={type} onClick={() => { setSelectedPallet(null); setModal(type) }}
            style={{ background:'#2a2a2a', border:`1px solid ${border}`, borderRadius:12, padding:24, cursor:'pointer', textAlign:'left', transition:'all 0.2s', display:'flex', flexDirection:'column', gap:12 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = hoverBorder; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = border; (e.currentTarget as HTMLElement).style.transform = 'none' }}>
            <div style={{ width:44, height:44, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon size={22} color={iconColor} />
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:titleColor, marginBottom:4 }}>{title}</div>
              <div style={{ fontSize:13, color:descColor }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Mapa do armazém */}
      <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Activity size={16} color="#d4a04a" />
          <span style={{ fontWeight:700, fontSize:15 }}>Mapa do armazém</span>
          <span style={{ fontSize:12, color:'#6b7280', marginLeft:'auto' }}>Clique num pallet para registrar saída</span>
        </div>

        <div style={{ display:'flex', gap:20 }}>
          {/* Grade */}
          <div style={{ flex:2, display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12, background:'#1e1e1e', padding:16, borderRadius:8, border:'3px solid #4b5563' }}>
            {shelfPositions.map(pos => {
              const item = mockProdutos.find(i => i.position === pos)
              const isSelected = selectedPallet?.position === pos
              return item ? (
                <div key={pos} onClick={() => setSelectedPallet(isSelected ? null : item)}
                  style={{ aspectRatio:'1', borderBottom:`5px solid ${isSelected ? '#d4a04a' : '#4b5563'}`, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center', paddingBottom:8, cursor:'pointer', position:'relative', borderRadius:6, background: isSelected ? '#3a2e1a' : '#2a2a2a', transition:'all 0.15s' }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#333' }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#2a2a2a' }}>
                  <span style={{ position:'absolute', top:6, left:8, fontSize:11, fontWeight:700, color:'#6b7280' }}>{pos}</span>
                  <Package size={36} color="#d4a04a" />
                  <span style={{ fontSize:10, fontWeight:700, color:'#d4a04a', marginTop:4 }}>{item.code}</span>
                </div>
              ) : (
                <div key={pos} style={{ aspectRatio:'1', border:'2px dashed #3a3a3a', borderBottom:'5px solid #3a3a3a', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', borderRadius:6, position:'relative', background:'#2a2a2a' }}>
                  <span style={{ position:'absolute', top:6, left:8, fontSize:11, fontWeight:700, color:'#4b5563' }}>{pos}</span>
                  <span style={{ fontSize:12, color:'#4b5563' }}>Vazio</span>
                </div>
              )
            })}
          </div>

          {/* Painel de detalhes */}
          <div style={{ flex:1, background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:8, padding:20, height:'fit-content' }}>
            {selectedPallet ? (
              <>
                <h3 style={{ margin:'0 0 16px', fontSize:15, fontWeight:600, color:'#f3f4f6' }}>Detalhes do pallet</h3>
                {([
                  ['Posição',    selectedPallet.position],
                  ['Código',     selectedPallet.code],
                  ['Produto',    selectedPallet.name],
                  ['Quantidade', `${selectedPallet.qty} un.`],
                  ['Entrada',    selectedPallet.entryDate],
                  ['Validade',   selectedPallet.valDate],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #3a3a3a', fontSize:13, color:'#9ca3af' }}>
                    <span>{k}</span><strong style={{ color:'#f3f4f6' }}>{v}</strong>
                  </div>
                ))}
                <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:20 }}>
                  <button onClick={() => openSaida(selectedPallet)}
                    style={{ width:'100%', padding:'10px 0', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    ↑ Registrar Saída
                  </button>
                  <button onClick={() => setModal('entrada')}
                    style={{ width:'100%', padding:'10px 0', borderRadius:8, border:'1px solid #10b981', background:'transparent', color:'#10b981', fontWeight:600, fontSize:13, cursor:'pointer' }}>
                    ↓ Registrar Entrada
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color:'#6b7280', fontSize:13, textAlign:'center', marginTop:40 }}>
                Selecione um pallet no mapa para ver os detalhes.
              </p>
            )}
          </div>
        </div>
      </div>

      {modal === 'entrada' && <ModalEntrada onClose={() => setModal(null)} />}
      {modal === 'saida'   && <ModalSaida  onClose={() => { setModal(null); setSelectedPallet(null) }} produto={selectedPallet} />}
    </div>
  )
}

// ─── Estilos inline compartilhados ───────────────────────────────────────────
const overlay:     React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }
const modal:       React.CSSProperties = { background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:16, padding:28, width:'100%', maxWidth:520 }
const modalHeader: React.CSSProperties = { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }
const closeBtn:    React.CSSProperties = { background:'transparent', border:'none', color:'#6b7280', cursor:'pointer', padding:4, borderRadius:6 }
const formGrid:    React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }
const formGroup:   React.CSSProperties = { display:'flex', flexDirection:'column', gap:6 }
const labelStyle:  React.CSSProperties = { fontSize:12, color:'#9ca3af', fontWeight:500 }
const inputStyle:  React.CSSProperties = { background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:8, padding:'8px 12px', color:'#f3f4f6', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' }
const btnPrimary:  React.CSSProperties = { padding:'9px 20px', borderRadius:8, border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }
const btnSecondary:React.CSSProperties = { padding:'9px 20px', borderRadius:8, border:'1px solid #3a3a3a', background:'transparent', color:'#9ca3af', fontSize:13, cursor:'pointer' }