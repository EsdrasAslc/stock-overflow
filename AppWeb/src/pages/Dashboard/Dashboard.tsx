import { useState, useEffect } from 'react'
import { Package, LayoutGrid, AlertTriangle, Ban, Bot, RefreshCw, Activity } from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface KpiItem {
  icon: React.ElementType
  color: string
  bg: string
  value: string
  label: string
}

interface CategoryItem {
  label: string
  value: number
  color: string
}

interface LogItem {
  id: number
  operator: string
  action: 'Retirar' | 'Guardar'
  product: string
  position: string
  status: 'SUCESSO' | 'FALHA'
  time: string
}

// ─── Dados simulados ──────────────────────────────────────────────────────────
const mockKpis: KpiItem[] = [
  { icon: Package,       color: '#10b981', bg: '#0d2e22', value: '48',    label: 'Produtos cadastrados' },
  { icon: LayoutGrid,    color: '#3b82f6', bg: '#0d1f3d', value: '41/64', label: 'Slots ocupados'       },
  { icon: AlertTriangle, color: '#f59e0b', bg: '#2d2006', value: '5',     label: 'Vencem em 30 dias'   },
  { icon: Ban,           color: '#f87171', bg: '#2d0f0f', value: '2',     label: 'Lotes vencidos'      },
]

const mockCategories: CategoryItem[] = [
  { label: 'Eletrônico', value: 18, color: '#10b981' },
  { label: 'Mecânico',   value: 14, color: '#3b82f6' },
  { label: 'Químico',    value: 9,  color: '#f59e0b' },
  { label: 'Perecível',  value: 7,  color: '#8b5cf6' },
]

const mockStorage = { occupied: 41, free: 23, pct: 64 }

const mockRobot = {
  status: 'STANDBY',
  temperatura: '38.2°C',
  tempPct: 62,
  bateria: 87,
  ciclosTotais: '1.247',
  uptime: '14h 32min',
  ultimaManutencao: '12 dias atrás',
  firmware: 'v2.4.1',
}

const mockLog: LogItem[] = [
  { id:1, operator:'Leonardo Monteiro', action:'Retirar', product:'ESP32',            position:'E1L2C3', status:'SUCESSO', time:'5min atrás'  },
  { id:2, operator:'Thiago',            action:'Guardar', product:'Sensor HC-SR04',   position:'E1L1C2', status:'SUCESSO', time:'18min atrás' },
  { id:3, operator:'Eduardo',           action:'Retirar', product:'Resina Epóxi',     position:'E2L3C1', status:'FALHA',   time:'45min atrás' },
  { id:4, operator:'Esdras',            action:'Guardar', product:'Bateria Li-Po 3S', position:'E1L3C4', status:'SUCESSO', time:'1h atrás'    },
  { id:5, operator:'Isabella',          action:'Retirar', product:'Motor DC 12V',     position:'E2L2C2', status:'SUCESSO', time:'2h atrás'    },
  { id:6, operator:'Italo',             action:'Guardar', product:'Cabo USB-C',       position:'E1L1C4', status:'SUCESSO', time:'3h atrás'    },
  { id:7, operator:'Pedro',             action:'Retirar', product:'Resistor 10kΩ',    position:'E2L1C3', status:'SUCESSO', time:'4h atrás'    },
]

// ─── Gráfico de rosca SVG ─────────────────────────────────────────────────────
interface DonutChartProps {
  data: { value: number; color: string }[]
  size?: number
  centerText?: React.ReactNode
}

function DonutChart({ data, size = 130, centerText }: DonutChartProps) {
  const cx = size / 2, cy = size / 2
  const r  = size / 2 - 14
  const c  = 2 * Math.PI * r
  let cum  = 0
  const total = data.reduce((s, d) => s + d.value, 0)
  const slices = data.map(d => {
    const pct  = d.value / total
    const off  = c * (1 - cum)
    const dash = c * pct
    cum += pct
    return { ...d, off, dash }
  })
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth="22"
            strokeDasharray={`${s.dash} ${c - s.dash}`}
            strokeDashoffset={s.off} />
        ))}
        <circle cx={cx} cy={cy} r={r - 15} fill="#2a2a2a" />
      </svg>
      {centerText && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {centerText}
        </div>
      )}
    </div>
  )
}

// ─── Barra de progresso ───────────────────────────────────────────────────────
function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ background: '#333', borderRadius: 99, height: 6, flex: 1 }}>
      <div style={{ width: `${value}%`, background: color, borderRadius: 99, height: '100%', transition: 'width 0.6s ease' }} />
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [lastUpdate, setLastUpdate] = useState('30s atrás')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setLastUpdate(p => p), 30000)
    return () => clearInterval(id)
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => { setRefreshing(false); setLastUpdate('Agora') }, 1200)
  }

  return (
    <div style={{ background:'#1e1e1e', minHeight:'100vh', padding:24, fontFamily:"'Inter', sans-serif", color:'#f3f4f6' }}>

      {/* ── Topbar ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#f3f4f6' }}>Visualização do estoque</h1>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#6b7280' }}>
            🕐 Atualizado {lastUpdate} · dados de demonstração
          </p>
        </div>
        <button onClick={handleRefresh} style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', color:'#f3f4f6', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Atualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {mockKpis.map(({ icon: Icon, color, bg, value, label }) => (
          <div key={label} style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:42, height:42, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize:26, fontWeight:800, lineHeight:1, color:'#f3f4f6' }}>{value}</div>
              <div style={{ fontSize:12, color:'#6b7280', marginTop:3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid: Gráficos + Robô ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>

        {/* Categorias */}
        <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#6b7280', textTransform:'uppercase', marginBottom:16 }}>
            Categorias no estoque
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <DonutChart data={mockCategories} size={120} />
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {mockCategories.map(c => (
                <div key={c.label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                  <span style={{ color:'#d1d5db' }}>{c.label}</span>
                  <span style={{ color:'#f3f4f6', fontWeight:700, marginLeft:'auto', paddingLeft:8 }}>{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Armazenamento */}
        <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#6b7280', textTransform:'uppercase', marginBottom:16 }}>
            Armazenamento utilizado
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <DonutChart
              data={[
                { value: mockStorage.occupied, color: '#f59e0b' },
                { value: mockStorage.free,     color: '#333333' },
              ]}
              size={120}
              centerText={
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#f59e0b' }}>{mockStorage.pct}%</div>
                  <div style={{ fontSize:10, color:'#6b7280' }}>em uso</div>
                </div>
              }
            />
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
                <span style={{ color:'#d1d5db' }}>Ocupados</span>
                <span style={{ color:'#f3f4f6', fontWeight:700, marginLeft:'auto', paddingLeft:8 }}>{mockStorage.occupied}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#374151' }} />
                <span style={{ color:'#d1d5db' }}>Livres</span>
                <span style={{ color:'#f3f4f6', fontWeight:700, marginLeft:'auto', paddingLeft:8 }}>{mockStorage.free}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Robô */}
        <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Bot size={16} color="#d4a04a" />
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#6b7280', textTransform:'uppercase' }}>
                Telemetria do robô
              </span>
            </div>
            <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:99, background:'#1e2a1e', color:'#10b981', border:'1px solid #10b98133' }}>
              ● {mockRobot.status}
            </span>
          </div>

          <div style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#9ca3af', marginBottom:4 }}>
              <span>Temperatura</span>
              <span style={{ color:'#f59e0b', fontWeight:600 }}>{mockRobot.temperatura}</span>
            </div>
            <ProgressBar value={mockRobot.tempPct} color="#f59e0b" />
          </div>

          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#9ca3af', marginBottom:4 }}>
              <span>Bateria</span>
              <span style={{ color:'#10b981', fontWeight:600 }}>{mockRobot.bateria}%</span>
            </div>
            <ProgressBar value={mockRobot.bateria} color="#10b981" />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {([
              ['Ciclos totais',     mockRobot.ciclosTotais],
              ['Uptime',            mockRobot.uptime],
              ['Última manutenção', mockRobot.ultimaManutencao],
              ['Firmware',          mockRobot.firmware],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:2 }}>{label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#f3f4f6' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Log de movimentações ── */}
      <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
          <Activity size={16} color="#10b981" />
          <span style={{ fontWeight:700, fontSize:15 }}>Log de movimentações</span>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #3a3a3a' }}>
              {['OPERADOR','AÇÃO','PRODUTO','POSIÇÃO','STATUS','HORÁRIO'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockLog.map(row => (
              <tr key={row.id} style={{ borderBottom:'1px solid #333' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <td style={{ padding:'12px', fontWeight:700, fontSize:13, color:'#f3f4f6' }}>{row.operator}</td>
                <td style={{ padding:'12px' }}>
                  <span style={{
                    fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99,
                    background: row.action === 'Guardar' ? '#0d2e22' : '#2d1a0d',
                    color:      row.action === 'Guardar' ? '#10b981'  : '#f59e0b',
                    border:     `1px solid ${row.action === 'Guardar' ? '#10b98133' : '#f59e0b33'}`,
                  }}>
                    {row.action === 'Guardar' ? '↓' : '↑'} {row.action}
                  </span>
                </td>
                <td style={{ padding:'12px', fontSize:13, color:'#d1d5db' }}>{row.product}</td>
                <td style={{ padding:'12px' }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:6, background:'#3a3a3a', color:'#9ca3af' }}>
                    {row.position}
                  </span>
                </td>
                <td style={{ padding:'12px' }}>
                  <span style={{
                    fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99,
                    background: row.status === 'SUCESSO' ? '#0d2e22' : '#2d0f0f',
                    color:      row.status === 'SUCESSO' ? '#10b981'  : '#f87171',
                    border:     `1px solid ${row.status === 'SUCESSO' ? '#10b98133' : '#f8717133'}`,
                  }}>
                    {row.status === 'SUCESSO' ? '✓' : '△'} {row.status}
                  </span>
                </td>
                <td style={{ padding:'12px', fontSize:12, color:'#6b7280' }}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}