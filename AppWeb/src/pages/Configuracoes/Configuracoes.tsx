import { useState } from 'react'
import {
  Users, Warehouse, Settings,
  Plus, Pencil, Trash2, Save, X, Eye, EyeOff,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Tab = 'usuarios' | 'armazem' | 'sistema'
type Perfil = 'Gerente' | 'Operador'
type ModalType = 'novo_usuario' | 'editar_usuario' | null

interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  ultimoAcesso: string
}

interface Localizacao {
  id: number
  corredor: string
  prateleiras: number
  posicoes: number
  capacidade: number
}

// ─── Dados simulados ──────────────────────────────────────────────────────────
const mockUsuarios: Usuario[] = [
  { id:1, nome:'Leonardo Monteiro', email:'leonardo@stock.com', perfil:'Gerente',  ativo:true,  ultimoAcesso:'hoje, 14:32'  },
  { id:2, nome:'Thiago',            email:'thiago@stock.com',   perfil:'Operador', ativo:true,  ultimoAcesso:'hoje, 13:10'  },
  { id:3, nome:'Eduardo',           email:'eduardo@stock.com',  perfil:'Operador', ativo:true,  ultimoAcesso:'hoje, 09:44'  },
  { id:4, nome:'Isabella',          email:'isabella@stock.com', perfil:'Operador', ativo:true,  ultimoAcesso:'ontem, 16:20' },
  { id:5, nome:'Pedro',             email:'pedro@stock.com',    perfil:'Operador', ativo:false, ultimoAcesso:'há 5 dias'    },
]

const mockLocalizacoes: Localizacao[] = [
  { id:1, corredor:'A', prateleiras:3, posicoes:4, capacidade:12 },
  { id:2, corredor:'B', prateleiras:3, posicoes:4, capacidade:12 },
  { id:3, corredor:'C', prateleiras:2, posicoes:4, capacidade:8  },
]

const perfilColor: Record<Perfil, { bg: string; color: string }> = {
  Gerente:  { bg:'#1e3a5f', color:'#60a5fa' },
  Operador: { bg:'#0d2e22', color:'#10b981' },
}

// ─── Estilos inline compartilhados ───────────────────────────────────────────
const card:    React.CSSProperties = { background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:12, padding:20, marginBottom:16 }
const inp:     React.CSSProperties = { background:'#1e1e1e', border:'1px solid #3a3a3a', borderRadius:8, padding:'8px 12px', color:'#f3f4f6', fontSize:13, outline:'none', width:'100%', boxSizing:'border-box' }
const label:   React.CSSProperties = { fontSize:12, color:'#9ca3af', fontWeight:500, display:'block', marginBottom:4 }
const row:     React.CSSProperties = { display:'flex', gap:12, marginBottom:12 }
const btnSave: React.CSSProperties = { display:'flex', alignItems:'center', gap:6, background:'#d4a04a', border:'none', color:'#1e1e1e', padding:'8px 18px', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }
const btnGhost:React.CSSProperties = { display:'flex', alignItems:'center', gap:6, background:'transparent', border:'1px solid #3a3a3a', color:'#9ca3af', padding:'8px 14px', borderRadius:8, fontSize:13, cursor:'pointer' }
const overlay: React.CSSProperties = { position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }
const modal:   React.CSSProperties = { background:'#2a2a2a', border:'1px solid #3a3a3a', borderRadius:16, padding:28, width:'100%', maxWidth:480 }

// ─── Aba: Usuários ────────────────────────────────────────────────────────────
function TabUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(mockUsuarios)
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ nome:'', email:'', perfil:'Operador' as Perfil, senha:'' })

  const abrirNovo = () => {
    setForm({ nome:'', email:'', perfil:'Operador', senha:'' })
    setEditando(null)
    setModalType('novo_usuario')
  }

  const abrirEditar = (u: Usuario) => {
    setForm({ nome:u.nome, email:u.email, perfil:u.perfil, senha:'' })
    setEditando(u)
    setModalType('editar_usuario')
  }

  const salvar = () => {
    if (!form.nome || !form.email) return
    if (editando) {
      setUsuarios(p => p.map(u => u.id === editando.id ? { ...u, ...form } : u))
    } else {
      setUsuarios(p => [...p, { id: Date.now(), nome:form.nome, email:form.email, perfil:form.perfil, ativo:true, ultimoAcesso:'agora' }])
    }
    setModalType(null)
  }

  const toggleAtivo = (id: number) => setUsuarios(p => p.map(u => u.id === id ? { ...u, ativo: !u.ativo } : u))
  const excluir     = (id: number) => setUsuarios(p => p.filter(u => u.id !== id))

  return (
    <>
      <div style={card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#f3f4f6' }}>Operadores e acessos</div>
            <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{usuarios.filter(u=>u.ativo).length} usuários ativos</div>
          </div>
          <button onClick={abrirNovo} style={btnSave}>
            <Plus size={15} /> Novo usuário
          </button>
        </div>

        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #3a3a3a' }}>
              {['Nome','E-mail','Perfil','Último acesso','Status','Ações'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usuarios.map(u => {
              const pc = perfilColor[u.perfil]
              return (
                <tr key={u.id} style={{ borderBottom:'1px solid #333' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#333'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                  <td style={{ padding:'12px', fontSize:13, fontWeight:600, color: u.ativo ? '#f3f4f6' : '#6b7280' }}>{u.nome}</td>
                  <td style={{ padding:'12px', fontSize:13, color:'#9ca3af' }}>{u.email}</td>
                  <td style={{ padding:'12px' }}>
                    <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, background:pc.bg, color:pc.color, border:`1px solid ${pc.color}33` }}>{u.perfil}</span>
                  </td>
                  <td style={{ padding:'12px', fontSize:12, color:'#6b7280' }}>{u.ultimoAcesso}</td>
                  <td style={{ padding:'12px' }}>
                    <button onClick={() => toggleAtivo(u.id)} style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:99, cursor:'pointer', border:'none',
                      background: u.ativo ? '#0d2e22' : '#2a2a2a',
                      color:      u.ativo ? '#10b981'  : '#6b7280' }}>
                      {u.ativo ? '● Ativo' : '○ Inativo'}
                    </button>
                  </td>
                  <td style={{ padding:'12px', display:'flex', gap:8 }}>
                    <button onClick={() => abrirEditar(u)} style={{ ...btnGhost, padding:'5px 10px' }}><Pencil size={14} /></button>
                    <button onClick={() => excluir(u.id)}  style={{ ...btnGhost, padding:'5px 10px', color:'#f87171', borderColor:'#7f1d1d' }}><Trash2 size={14} /></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal novo/editar usuário */}
      {modalType && (
        <div style={overlay}>
          <div style={modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ margin:0, fontSize:17, color:'#f3f4f6', fontWeight:700 }}>
                {modalType === 'novo_usuario' ? 'Novo usuário' : 'Editar usuário'}
              </h2>
              <button onClick={() => setModalType(null)} style={{ background:'transparent', border:'none', color:'#6b7280', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={row}>
              <div style={{ flex:1 }}>
                <label style={label}>Nome completo *</label>
                <input style={inp} value={form.nome} onChange={e => setForm(p=>({...p,nome:e.target.value}))} placeholder="Nome do operador" />
              </div>
            </div>
            <div style={row}>
              <div style={{ flex:1 }}>
                <label style={label}>E-mail *</label>
                <input style={inp} type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="email@empresa.com" />
              </div>
            </div>
            <div style={row}>
              <div style={{ flex:1 }}>
                <label style={label}>Perfil *</label>
                <select style={inp} value={form.perfil} onChange={e => setForm(p=>({...p,perfil:e.target.value as Perfil}))}>
                  <option style={{background:'#1e1e1e'}}>Gerente</option>
                  <option style={{background:'#1e1e1e'}}>Operador</option>
                </select>
              </div>
              <div style={{ flex:1 }}>
                <label style={label}>{modalType === 'novo_usuario' ? 'Senha *' : 'Nova senha (opcional)'}</label>
                <div style={{ position:'relative' }}>
                  <input style={{ ...inp, paddingRight:36 }} type={showPass ? 'text' : 'password'} value={form.senha} onChange={e => setForm(p=>({...p,senha:e.target.value}))} placeholder="••••••••" />
                  <button onClick={() => setShowPass(p=>!p)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#6b7280' }}>
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:8 }}>
              <button onClick={() => setModalType(null)} style={btnGhost}>Cancelar</button>
              <button onClick={salvar} style={btnSave}><Save size={14}/> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Aba: Armazém ─────────────────────────────────────────────────────────────
function TabArmazem() {
  const [locs] = useState<Localizacao[]>(mockLocalizacoes)
  const [estoqueMin, setEstoqueMin] = useState('10')
  const [alertaVenc, setAlertaVenc] = useState('30')
  const [saved, setSaved] = useState(false)

  const salvar = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <>
      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, color:'#f3f4f6', marginBottom:4 }}>Estrutura do armazém</div>
        <div style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>Corredores, prateleiras e posições cadastrados</div>
        <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:16 }}>
          <thead>
            <tr style={{ borderBottom:'1px solid #3a3a3a' }}>
              {['Corredor','Prateleiras','Posições por prateleira','Total de slots'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', fontSize:11, fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locs.map(l => (
              <tr key={l.id} style={{ borderBottom:'1px solid #333' }}>
                <td style={{ padding:'12px', fontSize:14, fontWeight:700, color:'#d4a04a' }}>Corredor {l.corredor}</td>
                <td style={{ padding:'12px', fontSize:13, color:'#d1d5db' }}>{l.prateleiras}</td>
                <td style={{ padding:'12px', fontSize:13, color:'#d1d5db' }}>{l.posicoes}</td>
                <td style={{ padding:'12px' }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:6, background:'#3a3a3a', color:'#9ca3af' }}>{l.capacidade} slots</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize:12, color:'#6b7280', padding:'10px 12px', background:'#1e1e1e', borderRadius:8, border:'1px solid #3a3a3a' }}>
          Total de slots: <strong style={{ color:'#f3f4f6' }}>{locs.reduce((s,l) => s+l.capacidade,0)}</strong> &nbsp;·&nbsp;
          Para adicionar ou editar corredores, contate o administrador do sistema.
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, color:'#f3f4f6', marginBottom:16 }}>Parâmetros de estoque</div>
        <div style={row}>
          <div style={{ flex:1 }}>
            <label style={label}>Estoque mínimo padrão (unidades)</label>
            <input style={inp} type="number" min={1} value={estoqueMin} onChange={e => setEstoqueMin(e.target.value)} />
            <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>Usado quando o produto não tem mínimo individual definido.</div>
          </div>
          <div style={{ flex:1 }}>
            <label style={label}>Alerta de vencimento (dias antes)</label>
            <input style={inp} type="number" min={1} value={alertaVenc} onChange={e => setAlertaVenc(e.target.value)} />
            <div style={{ fontSize:11, color:'#6b7280', marginTop:4 }}>Produtos aparecem em alerta X dias antes de vencer.</div>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:4 }}>
          <button onClick={salvar} style={btnSave}>
            {saved ? '✓ Salvo!' : <><Save size={14}/> Salvar parâmetros</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Aba: ESP32 ───────────────────────────────────────────────────────────────

// ─── Aba: Notificações ────────────────────────────────────────────────────────

// ─── Aba: Sistema ─────────────────────────────────────────────────────────────
function TabSistema() {
  const [cfg, setCfg] = useState({
    nomeEmpresa: 'StockOverflow Ltda.',
    nomeArmazem: 'Armazém Principal',
    fuso: 'America/Bahia',
    versao: 'v1.0.0',
  })
  const [saved, setSaved] = useState(false)
  const handle = (k: keyof typeof cfg, v: string) => setCfg(p => ({...p,[k]:v}))
  const salvar = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <>
      <div style={card}>
        <div style={{ fontSize:15, fontWeight:700, color:'#f3f4f6', marginBottom:16 }}>Informações gerais</div>
        <div style={row}>
          <div style={{ flex:1 }}>
            <label style={label}>Nome da empresa</label>
            <input style={inp} value={cfg.nomeEmpresa} onChange={e => handle('nomeEmpresa', e.target.value)} />
          </div>
          <div style={{ flex:1 }}>
            <label style={label}>Nome do armazém</label>
            <input style={inp} value={cfg.nomeArmazem} onChange={e => handle('nomeArmazem', e.target.value)} />
          </div>
        </div>
        <div style={row}>
          <div style={{ flex:1 }}>
            <label style={label}>Fuso horário</label>
            <select style={inp} value={cfg.fuso} onChange={e => handle('fuso', e.target.value)}>
              {['America/Sao_Paulo','America/Bahia','America/Manaus','America/Belem','America/Fortaleza','America/Recife'].map(f => (
                <option key={f} value={f} style={{background:'#1e1e1e'}}>{f}</option>
              ))}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <label style={label}>Versão do sistema</label>
            <input style={{ ...inp, color:'#6b7280' }} value={cfg.versao} disabled />
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={salvar} style={btnSave}>
            {saved ? '✓ Salvo!' : <><Save size={14}/> Salvar</>}
          </button>
        </div>
      </div>

      {/* Zona de perigo */}
      <div style={{ ...card, border:'1px solid #7f1d1d' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'#f87171', marginBottom:4 }}>Zona de perigo</div>
        <div style={{ fontSize:12, color:'#6b7280', marginBottom:16 }}>Ações irreversíveis — execute com cuidado.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'Limpar log de movimentações',  desc:'Remove todo o histórico de entradas e saídas'       },
            { label:'Limpar registro de falhas',    desc:'Remove todo o histórico de falhas e erros do robô'  },
          ].map(({ label: l, desc }) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'#1e1e1e', borderRadius:8, border:'1px solid #3a3a3a' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#f3f4f6' }}>{l}</div>
                <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{desc}</div>
              </div>
              <button style={{ ...btnGhost, color:'#f87171', borderColor:'#7f1d1d', flexShrink:0 }}>Executar</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState<Tab>('usuarios')

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key:'usuarios', label:'Usuários', icon:Users    },
    { key:'armazem',  label:'Armazém',  icon:Warehouse },
    { key:'sistema',  label:'Sistema',  icon:Settings },
  ]

  return (
    <div style={{ background:'#1e1e1e', minHeight:'100vh', padding:24, fontFamily:"'Inter', sans-serif", color:'#f3f4f6' }}>

      <h1 style={{ margin:'0 0 4px', fontSize:22, fontWeight:700 }}>Configurações</h1>
      <p style={{ margin:'0 0 24px', fontSize:13, color:'#6b7280' }}>Visão do Gerente — acesso total ao sistema</p>

      {/* Abas */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'#2a2a2a', padding:4, borderRadius:12, width:'fit-content', flexWrap:'wrap' }}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'9px 16px', borderRadius:9, border:'none', cursor:'pointer',
            fontSize:13, fontWeight:500, transition:'all 0.15s',
            background: activeTab === key ? '#3a3a3a' : 'transparent',
            color:      activeTab === key ? '#f3f4f6'  : '#6b7280',
          }}>
            <Icon size={15} color={activeTab === key ? '#d4a04a' : '#6b7280'} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'usuarios' && <TabUsuarios />}
      {activeTab === 'armazem'  && <TabArmazem />}
      {activeTab === 'sistema'  && <TabSistema />}

    </div>
  )
}