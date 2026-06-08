import { useState } from 'react'
import {
  AlertTriangle, AlertCircle, History,
  Search, Calendar, User, Filter,
  Download, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Tab = 'vencimento' | 'falhas' | 'historico'

interface Product {
  id: number
  code: string
  name: string
  category: string
  position: string
  qty: number
  valDate: string
  daysLeft: number
}

interface Failure {
  id: number
  timestamp: string
  type: string
  description: string
  position: string
  operator: string
  resolved: boolean
}

interface Movement {
  id: number
  date: string
  operator: string
  action: 'Entrada' | 'Saída'
  product: string
  code: string
  position: string
  qty: number
  status: 'SUCESSO' | 'FALHA'
}

// ─── Dados simulados ──────────────────────────────────────────────────────────
const mockExpiring: Product[] = [
  { id:1, code:'CH-105', name:'Resina Epóxi (Litro)',     category:'Químico',    position:'1B2', qty:15, valDate:'2024-12-01', daysLeft:-180 },
  { id:2, code:'CH-210', name:'Acetona P.A.',             category:'Químico',    position:'2A1', qty:8,  valDate:'2025-02-14', daysLeft:-90  },
  { id:3, code:'PE-001', name:'Luva Nitrílica (cx)',      category:'Perecível',  position:'3C2', qty:50, valDate:'2026-06-10', daysLeft:3    },
  { id:4, code:'PE-044', name:'Fita Isolante PVC',        category:'Perecível',  position:'1A4', qty:30, valDate:'2026-06-20', daysLeft:13   },
  { id:5, code:'CH-330', name:'Silicone RTV (tubo)',      category:'Químico',    position:'2B3', qty:12, valDate:'2026-07-01', daysLeft:24   },
  { id:6, code:'PE-078', name:'Etiqueta Adesiva (rolo)',  category:'Perecível',  position:'1C1', qty:200,valDate:'2026-07-15', daysLeft:38   },
]

const mockFailures: Failure[] = [
  { id:1, timestamp:'2026-05-23 14:32', type:'Sensor',    description:'Sensor ultrassônico não detectou pallet na posição 1A1',  position:'1A1', operator:'Leonardo Monteiro', resolved:true  },
  { id:2, timestamp:'2026-05-23 11:10', type:'Motor',     description:'Motor do eixo Y travou durante operação de retirada',     position:'2B2', operator:'Thiago',            resolved:true  },
  { id:3, timestamp:'2026-05-22 16:44', type:'Rede',      description:'Timeout na comunicação MQTT — reconexão automática',      position:'BASE',operator:'Sistema',           resolved:true  },
  { id:4, timestamp:'2026-05-22 09:15', type:'Sensor',    description:'Leitura de código de barras falhou 3 vezes consecutivas', position:'1C3', operator:'Eduardo',           resolved:false },
  { id:5, timestamp:'2026-05-21 13:20', type:'Firmware',  description:'Atualização de firmware interrompida — bateria baixa',   position:'BASE',operator:'Sistema',           resolved:false },
  { id:6, timestamp:'2026-05-20 08:05', type:'Colisão',   description:'Robô detectou obstáculo inesperado no corredor 2',       position:'COR2',operator:'Isabella',          resolved:true  },
]

const mockMovements: Movement[] = [
  { id:1,  date:'2026-05-23 14:32', operator:'Leonardo Monteiro', action:'Saída',   product:'Microcontrolador ESP32',       code:'HW-001', position:'E1L2C3', qty:5,  status:'SUCESSO' },
  { id:2,  date:'2026-05-23 13:58', operator:'Thiago',            action:'Entrada', product:'Sensor HC-SR04',               code:'SN-022', position:'E1L1C2', qty:20, status:'SUCESSO' },
  { id:3,  date:'2026-05-23 13:10', operator:'Eduardo',           action:'Saída',   product:'Resina Epóxi',                 code:'CH-105', position:'E2L3C1', qty:3,  status:'FALHA'   },
  { id:4,  date:'2026-05-23 12:44', operator:'Esdras',            action:'Entrada', product:'Bateria Li-Po 3S',             code:'BT-900', position:'E1L3C4', qty:10, status:'SUCESSO' },
  { id:5,  date:'2026-05-23 11:30', operator:'Isabella',          action:'Saída',   product:'Microcontrolador ESP32',       code:'HW-001', position:'E1L2C3', qty:2,  status:'SUCESSO' },
  { id:6,  date:'2026-05-23 10:55', operator:'Ítalo',             action:'Entrada', product:'Sensor HC-SR04',               code:'SN-022', position:'E1L1C2', qty:15, status:'SUCESSO' },
  { id:7,  date:'2026-05-23 09:40', operator:'Pedro',             action:'Saída',   product:'Bateria Li-Po 3S',             code:'BT-900', position:'E1L3C4', qty:4,  status:'SUCESSO' },
  { id:8,  date:'2026-05-22 16:20', operator:'Leonardo Monteiro', action:'Entrada', product:'Resina Epóxi',                 code:'CH-105', position:'E2L3C1', qty:8,  status:'SUCESSO' },
  { id:9,  date:'2026-05-22 14:00', operator:'Thiago',            action:'Saída',   product:'Motor DC 12V',                 code:'MT-200', position:'E2L2C2', qty:1,  status:'SUCESSO' },
  { id:10, date:'2026-05-22 10:30', operator:'Eduardo',           action:'Entrada', product:'Cabo USB-C',                   code:'CB-050', position:'E1L1C4', qty:30, status:'SUCESSO' },
]

const operators = ['Todos', 'Leonardo Monteiro', 'Thiago', 'Eduardo', 'Esdras', 'Isabella', 'Ítalo', 'Pedro']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusColor(days: number): { bg: string; color: string; label: string } {
  if (days < 0)   return { bg:'#2d0f0f', color:'#f87171', label:'Vencido'         }
  if (days <= 7)  return { bg:'#2d1a0d', color:'#f97316', label:'Crítico'         }
  if (days <= 30) return { bg:'#2d2006', color:'#f59e0b', label:'Atenção'         }
  return              { bg:'#0d2e22', color:'#10b981', label:'OK'              }
}

// ─── Componente: aba de vencimento ────────────────────────────────────────────
function TabVencimento() {
  const [filter, setFilter] = useState<'todos' | 'vencidos' | 'criticos' | 'atencao'>('todos')

  const filtered = mockExpiring.filter(p => {
    if (filter === 'vencidos')  return p.daysLeft < 0
    if (filter === 'criticos')  return p.daysLeft >= 0 && p.daysLeft <= 7
    if (filter === 'atencao')   return p.daysLeft > 7 && p.daysLeft <= 30
    return true
  })

  const counts = {
    vencidos:  mockExpiring.filter(p => p.daysLeft < 0).length,
    criticos:  mockExpiring.filter(p => p.daysLeft >= 0 && p.daysLeft <= 7).length,
    atencao:   mockExpiring.filter(p => p.daysLeft > 7 && p.daysLeft <= 30).length,
  }

  return (
    <div>
      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        {[
          { key:'vencidos',  label:'Já vencidos',      count:counts.vencidos, color:'#f87171', bg:'#2d0f0f' },
          { key:'criticos',  label:'Vencem em 7 dias', count:counts.criticos, color:'#f97316', bg:'#2d1a0d' },
          { key:'atencao',   label:'Vencem em 30 dias',count:counts.atencao,  color:'#f59e0b', bg:'#2d2006' },
        ].map(k => (
          <button key={k.key} onClick={() => setFilter(filter === k.key as typeof filter ? 'todos' : k.key as typeof filter)}
            style={{ background: filter === k.key ? k.bg : '#2a2a2a', border:`1px solid ${filter === k.key ? k.color : '#3a3a3a'}`, borderRadius:10, padding:'14px 18px', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
            <div style={{ fontSize:28, fontWeight:800, color:k.color }}>{k.count}</div>
            <div style={{ fontSize:12, color:'#9ca3af', marginTop:2 }}>{k.label}</div>
          </button>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#1e1e1e' }}>
              {['Código','Produto','Categoria','Posição','Qtd','Validade','Situação'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = statusColor(p.daysLeft)
              return (
                <tr key={p.id} style={{ borderTop:'1px solid #3a3a3a' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#333'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <td style={{ padding:'12px 14px', fontWeight:700, fontSize:13, color:'#f3f4f6' }}>{p.code}</td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#d1d5db' }}>{p.name}</td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#9ca3af' }}>{p.category}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:12, padding:'2px 8px', borderRadius:6, background:'#3a3a3a', color:'#9ca3af' }}>{p.position}</span>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#d1d5db' }}>{p.qty} un.</td>
                  <td style={{ padding:'12px 14px', fontSize:13, color:'#d1d5db' }}>{p.valDate}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:s.bg, color:s.color, border:`1px solid ${s.color}33` }}>
                      {s.label} {p.daysLeft < 0 ? `(${Math.abs(p.daysLeft)}d)` : p.daysLeft <= 30 ? `(${p.daysLeft}d)` : ''}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Componente: aba de falhas ────────────────────────────────────────────────
function TabFalhas() {
  const [showResolved, setShowResolved] = useState(false)
  const [expanded, setExpanded]         = useState<number | null>(null)

  const filtered = showResolved ? mockFailures : mockFailures.filter(f => !f.resolved)

  const typeColor: Record<string, { bg: string; color: string }> = {
    Sensor:   { bg:'#1e3a5f', color:'#60a5fa' },
    Motor:    { bg:'#2d0f0f', color:'#f87171' },
    Rede:     { bg:'#1e2a1e', color:'#10b981' },
    Firmware: { bg:'#2d2006', color:'#f59e0b' },
    Colisão:  { bg:'#2d1a0d', color:'#f97316' },
  }

  return (
    <div>
      {/* Controles */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ display:'flex', gap:8 }}>
          <span style={{ padding:'4px 12px', borderRadius:99, background:'#2d0f0f', color:'#f87171', fontSize:12, fontWeight:600, border:'1px solid #f8717133' }}>
            {mockFailures.filter(f => !f.resolved).length} pendentes
          </span>
          <span style={{ padding:'4px 12px', borderRadius:99, background:'#0d2e22', color:'#10b981', fontSize:12, fontWeight:600, border:'1px solid #10b98133' }}>
            {mockFailures.filter(f => f.resolved).length} resolvidas
          </span>
        </div>
        <button onClick={() => setShowResolved(p => !p)}
          style={{ display:'flex', alignItems:'center', gap:6, background:'#2a2a2a', border:'1px solid #3a3a3a', color:'#9ca3af', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>
          <Filter size={14} />
          {showResolved ? 'Ocultar resolvidas' : 'Mostrar todas'}
        </button>
      </div>

      {/* Lista de falhas */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {filtered.map(f => {
          const tc = typeColor[f.type] ?? { bg:'#2a2a2a', color:'#9ca3af' }
          const isOpen = expanded === f.id
          return (
            <div key={f.id} style={{ background:'#2a2a2a', border:`1px solid ${f.resolved ? '#3a3a3a' : '#7f1d1d'}`, borderRadius:10, overflow:'hidden' }}>
              <button onClick={() => setExpanded(isOpen ? null : f.id)}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                {/* Status dot */}
                <div style={{ width:10, height:10, borderRadius:'50%', background: f.resolved ? '#10b981' : '#f87171', flexShrink:0, boxShadow: f.resolved ? 'none' : '0 0 6px #f87171' }} />
                {/* Tipo */}
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:6, background:tc.bg, color:tc.color, flexShrink:0 }}>{f.type}</span>
                {/* Descrição */}
                <span style={{ fontSize:13, color:'#d1d5db', flex:1 }}>{f.description}</span>
                {/* Meta */}
                <span style={{ fontSize:12, color:'#6b7280', flexShrink:0, marginRight:8 }}>{f.timestamp}</span>
                {isOpen ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
              </button>

              {isOpen && (
                <div style={{ padding:'0 16px 16px', borderTop:'1px solid #3a3a3a' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginTop:12 }}>
                    <div>
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Posição</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#f3f4f6' }}>{f.position}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Operador</div>
                      <div style={{ fontSize:13, fontWeight:600, color:'#f3f4f6' }}>{f.operator}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Status</div>
                      <span style={{ fontSize:12, fontWeight:600, padding:'2px 10px', borderRadius:99, background: f.resolved ? '#0d2e22' : '#2d0f0f', color: f.resolved ? '#10b981' : '#f87171', border:`1px solid ${f.resolved ? '#10b98133' : '#f8717133'}` }}>
                        {f.resolved ? '✓ Resolvida' : '△ Pendente'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#6b7280', fontSize:14 }}>
            Nenhuma falha encontrada.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente: aba de histórico ─────────────────────────────────────────────
function TabHistorico() {
  const [search, setSearch]       = useState('')
  const [operator, setOperator]   = useState('Todos')
  const [action, setAction]       = useState('Todos')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')

  const filtered = mockMovements.filter(m => {
    const matchSearch   = m.product.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())
    const matchOperator = operator === 'Todos' || m.operator === operator
    const matchAction   = action   === 'Todos' || m.action   === action
    const matchFrom     = dateFrom ? m.date >= dateFrom : true
    const matchTo       = dateTo   ? m.date <= dateTo + ' 23:59' : true
    return matchSearch && matchOperator && matchAction && matchFrom && matchTo
  })

  return (
    <div>
      {/* Filtros */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto', gap:10, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', padding:'8px 14px', borderRadius:8 }}>
          <Search size={15} color="#6b7280" />
          <input type="text" placeholder="Buscar produto ou código..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ border:'none', background:'transparent', outline:'none', color:'#d1d5db', fontSize:13, width:'100%' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', padding:'8px 14px', borderRadius:8 }}>
          <User size={15} color="#6b7280" />
          <select value={operator} onChange={e => setOperator(e.target.value)}
            style={{ border:'none', background:'transparent', outline:'none', color:'#d1d5db', fontSize:13, cursor:'pointer' }}>
            {operators.map(o => <option key={o} value={o} style={{ background:'#2a2a2a' }}>{o}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', padding:'8px 14px', borderRadius:8 }}>
          <Filter size={15} color="#6b7280" />
          <select value={action} onChange={e => setAction(e.target.value)}
            style={{ border:'none', background:'transparent', outline:'none', color:'#d1d5db', fontSize:13, cursor:'pointer' }}>
            {['Todos','Entrada','Saída'].map(a => <option key={a} value={a} style={{ background:'#2a2a2a' }}>{a}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', padding:'8px 14px', borderRadius:8 }}>
          <Calendar size={15} color="#6b7280" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ border:'none', background:'transparent', outline:'none', color:'#d1d5db', fontSize:13, cursor:'pointer' }} />
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', padding:'8px 14px', borderRadius:8 }}>
          <Calendar size={15} color="#6b7280" />
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ border:'none', background:'transparent', outline:'none', color:'#d1d5db', fontSize:13, cursor:'pointer' }} />
        </div>
      </div>

      {/* Contador + exportar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <span style={{ fontSize:13, color:'#6b7280' }}>{filtered.length} registro{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</span>
        <button style={{ display:'flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid #3a3a3a', color:'#9ca3af', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13 }}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      {/* Tabela */}
      <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:10, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#1e1e1e' }}>
              {['Data / Hora','Operador','Ação','Produto','Posição','Qtd','Status'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:'40px', color:'#6b7280', fontSize:14 }}>Nenhuma movimentação encontrada.</td></tr>
            ) : filtered.map(m => (
              <tr key={m.id} style={{ borderTop:'1px solid #3a3a3a' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td style={{ padding:'12px 14px', fontSize:12, color:'#6b7280' }}>{m.date}</td>
                <td style={{ padding:'12px 14px', fontSize:13, fontWeight:600, color:'#f3f4f6' }}>{m.operator}</td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99,
                    background: m.action === 'Entrada' ? '#0d2e22' : '#2d1a0d',
                    color:      m.action === 'Entrada' ? '#10b981'  : '#f59e0b',
                    border:    `1px solid ${m.action === 'Entrada' ? '#10b98133' : '#f59e0b33'}` }}>
                    {m.action === 'Entrada' ? '↓' : '↑'} {m.action}
                  </span>
                </td>
                <td style={{ padding:'12px 14px', fontSize:13, color:'#d1d5db' }}>{m.product}</td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ fontSize:12, padding:'2px 8px', borderRadius:6, background:'#3a3a3a', color:'#9ca3af' }}>{m.position}</span>
                </td>
                <td style={{ padding:'12px 14px', fontSize:13, color:'#d1d5db' }}>{m.qty} un.</td>
                <td style={{ padding:'12px 14px' }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99,
                    background: m.status === 'SUCESSO' ? '#0d2e22' : '#2d0f0f',
                    color:      m.status === 'SUCESSO' ? '#10b981'  : '#f87171',
                    border:    `1px solid ${m.status === 'SUCESSO' ? '#10b98133' : '#f8717133'}` }}>
                    {m.status === 'SUCESSO' ? '✓' : '△'} {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Relatorios() {
  const [activeTab, setActiveTab] = useState<Tab>('vencimento')

  const tabs: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
    { key:'vencimento', label:'Vencimento de produtos', icon:AlertTriangle, color:'#f59e0b' },
    { key:'falhas',     label:'Falhas e erros',         icon:AlertCircle,   color:'#f87171' },
    { key:'historico',  label:'Histórico de movimentações', icon:History,   color:'#10b981' },
  ]

  return (
    <div style={{ background:'#1e1e1e', minHeight:'100vh', padding:24, fontFamily:"'Inter', sans-serif", color:'#f3f4f6' }}>

      {/* Topbar */}
      <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Relatórios</h1>
      <p style={{ margin:'0 0 24px', fontSize:13, color:'#6b7280' }}>Acompanhamento e auditoria do sistema</p>

      {/* Abas */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'#2a2a2a', padding:4, borderRadius:12, width:'fit-content' }}>
        {tabs.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            style={{
              display:'flex', alignItems:'center', gap:8,
              padding:'10px 18px', borderRadius:9, border:'none', cursor:'pointer',
              fontSize:13, fontWeight:500, transition:'all 0.15s',
              background: activeTab === key ? '#3a3a3a' : 'transparent',
              color:      activeTab === key ? '#f3f4f6'  : '#6b7280',
            }}>
            <Icon size={16} color={activeTab === key ? color : '#6b7280'} />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {activeTab === 'vencimento' && <TabVencimento />}
      {activeTab === 'falhas'     && <TabFalhas />}
      {activeTab === 'historico'  && <TabHistorico />}

    </div>
  )
}