import { useState, useEffect } from 'react'
import { Package, LayoutGrid, AlertTriangle, Ban, RefreshCw, BarChart2, Activity } from 'lucide-react'

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
    const pct  = total > 0 ? d.value / total : 0
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
  const [lastUpdate, setLastUpdate] = useState('Atualizando...')
  const [refreshing, setRefreshing] = useState(false)
  const [metrics, setMetrics] = useState<any>({
    kpis: { produtosCadastrados: 0, slotsOcupados: '0/0', vencem30Dias: 0, lotesVencidos: 0 },
    categorias: [],
    armazenamento: { occupied: 0, free: 0, pct: 0 },
    topProducts: [],
    logs: []
  })

  const loadMetrics = () => {
    setRefreshing(true)
    fetch('http://localhost:8080/api/dashboard/metrics')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setLastUpdate('Agora')
      })
      .finally(() => setRefreshing(false))
  }

  useEffect(() => {
    loadMetrics()
  }, [])

  const handleRefresh = () => {
    loadMetrics()
  }

  const kpisToRender = [
    { icon: Package,       color: '#10b981', bg: '#0d2e22', value: metrics.kpis.produtosCadastrados,    label: 'Produtos cadastrados' },
    { icon: LayoutGrid,    color: '#3b82f6', bg: '#0d1f3d', value: metrics.kpis.slotsOcupados, label: 'Slots ocupados'       },
    { icon: AlertTriangle, color: '#f59e0b', bg: '#2d2006', value: metrics.kpis.vencem30Dias,     label: 'Vencem em 30 dias'   },
    { icon: Ban,           color: '#f87171', bg: '#2d0f0f', value: metrics.kpis.lotesVencidos,     label: 'Lotes vencidos'      },
  ]

  return (
    <div style={{ background:'#1e1e1e', minHeight:'100vh', padding:24, fontFamily:"'Inter', sans-serif", color:'#f3f4f6' }}>

      {/* ── Topbar ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:22, fontWeight:700, color:'#f3f4f6' }}>Visualização do estoque</h1>
          <p style={{ margin:'4px 0 0', fontSize:12, color:'#6b7280' }}>
            🕐 Atualizado {lastUpdate}
          </p>
        </div>
        <button onClick={handleRefresh} style={{ display:'flex', alignItems:'center', gap:8, background:'#2a2a2a', border:'1px solid #3a3a3a', color:'#f3f4f6', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
          <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Atualizar
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {kpisToRender.map(({ icon: Icon, color, bg, value, label }) => (
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

      {/* ── Grid: Gráficos + Top Produtos ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>

        {/* Categorias */}
        <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#6b7280', textTransform:'uppercase', marginBottom:16 }}>
            Categorias no estoque
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            {metrics.categorias.length > 0 ? (
              <>
                <DonutChart data={metrics.categorias} size={120} />
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight: 120, overflowY: 'auto', paddingRight: 4 }}>
                  {metrics.categorias.map((c: any) => (
                    <div key={c.label} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:c.color, flexShrink:0 }} />
                      <span style={{ color:'#d1d5db' }}>{c.label}</span>
                      <span style={{ color:'#f3f4f6', fontWeight:700, marginLeft:'auto', paddingLeft:8 }}>{c.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
               <div style={{ textAlign:'center', color:'#6b7280', width: '100%', padding: '20px 0' }}>Sem categorias</div>
            )}
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
                { value: metrics.armazenamento.occupied, color: '#f59e0b' },
                { value: metrics.armazenamento.free,     color: '#333333' },
              ]}
              size={120}
              centerText={
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:800, color:'#f59e0b' }}>{metrics.armazenamento.pct}%</div>
                  <div style={{ fontSize:10, color:'#6b7280' }}>em uso</div>
                </div>
              }
            />
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }} />
                <span style={{ color:'#d1d5db' }}>Ocupados</span>
                <span style={{ color:'#f3f4f6', fontWeight:700, marginLeft:'auto', paddingLeft:8 }}>{metrics.armazenamento.occupied}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#374151' }} />
                <span style={{ color:'#d1d5db' }}>Livres</span>
                <span style={{ color:'#f3f4f6', fontWeight:700, marginLeft:'auto', paddingLeft:8 }}>{metrics.armazenamento.free}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Produtos Analytics */}
        <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <BarChart2 size={16} color="#3b82f6" />
              <span style={{ fontSize:11, fontWeight:700, letterSpacing:'0.12em', color:'#6b7280', textTransform:'uppercase' }}>
                Top Produtos (Unidades)
              </span>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {metrics.topProducts && metrics.topProducts.length > 0 ? (
               metrics.topProducts.map((tp: any, index: number) => (
                 <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#d1d5db' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>{tp.name}</span>
                      <span style={{ color:'#3b82f6', fontWeight:700 }}>{tp.qty} un</span>
                    </div>
                    {/* Visual bar relative to max */}
                    <ProgressBar value={(tp.qty / Math.max(...metrics.topProducts.map((x: any) => x.qty))) * 100} color="#3b82f6" />
                 </div>
               ))
            ) : (
               <div style={{ textAlign:'center', color:'#6b7280', padding: '20px 0' }}>Nenhum produto em estoque</div>
            )}
          </div>
        </div>

      </div>

      {/* ── Log de movimentações ── */}
      <div style={{ background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20, marginBottom:20 }}>
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
            {metrics.logs?.map((item: any) => (
              <tr key={item.id} style={{ borderBottom:'1px solid #333' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#333'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                <td style={{ padding:'12px', fontSize:13, fontWeight:600, color:'#f3f4f6' }}>{item.operator}</td>
                <td style={{ padding:'12px', fontSize:13 }}>
                  <span style={{
                    padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                    background: item.action === 'INFO' ? '#0d2e22' : item.action === 'ERRO' ? '#2d0f0f' : '#333333',
                    color: item.action === 'INFO' ? '#10b981' : item.action === 'ERRO' ? '#f87171' : '#d1d5db',
                    border: `1px solid ${item.action === 'INFO' ? '#10b98133' : item.action === 'ERRO' ? '#f8717133' : '#3a3a3a'}`
                  }}>
                    {item.action}
                  </span>
                </td>
                <td style={{ padding:'12px', fontSize:13, color:'#d1d5db' }}>{item.product}</td>
                <td style={{ padding:'12px', fontSize:13, color:'#9ca3af', fontFamily:'monospace' }}>{item.position}</td>
                <td style={{ padding:'12px', fontSize:12, fontWeight:700, color: item.status==='SUCESSO'?'#10b981':'#f59e0b' }}>{item.status}</td>
                <td style={{ padding:'12px', fontSize:12, color:'#6b7280' }}>{item.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}