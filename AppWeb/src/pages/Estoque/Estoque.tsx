import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Search, Calendar, AlertCircle, List, LayoutGrid, ArrowLeft, Plus, ArrowDownCircle, ArrowUpCircle, X, CheckCircle, Database } from 'lucide-react'
import styles from './Estoque.module.css'

interface Armazem {
  id: string
  nome: string
}

interface Estante {
  id: string
  nome: string
  capacidadeMaxima: number
  capacidadeAtual: number
  x: number
  y: number
  robot?: { id: string, status: string }
}

interface Product {
  id: string
  code: string
  name: string
  category: string
  estanteId: string
  estanteNome: string
  x: number
  y: number
  entryDate: string
  valDate: string
  qty: number
}

// ─── Componentes de UI Básicos ────────────────────────────────────────────────
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }
const modal: React.CSSProperties = { background: '#111827', border: '1px solid #374151', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }
const closeBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4 }
const labelStyle: React.CSSProperties = { fontSize: 13, color: '#9ca3af', fontWeight: 500 }
const inputStyle: React.CSSProperties = { background: '#1f2937', border: '1px solid #374151', borderRadius: 8, padding: '10px 14px', color: '#f3f4f6', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' }
const btnPrimary: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }
const btnSecondary: React.CSSProperties = { padding: '10px 20px', borderRadius: 8, border: '1px solid #374151', background: 'transparent', color: '#9ca3af', fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }

// ─── Modal Entrada ────────────────────────────────────────────────────────────
function ModalEntrada({ onClose, inventory, estante, onRefresh }: { onClose: () => void, inventory: Product[], estante: Estante, onRefresh: () => void }) {
  const [form, setForm] = useState({ produto: '', nome: '', categoria: '', dataValidade: '', quantidade: '', x: '', y: '', fornecedor: '', nf: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const handle = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.produto || !form.quantidade || !form.x || !form.y) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/produtos/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto: form.produto,
          nome: form.nome,
          categoria: form.categoria,
          dataValidade: form.dataValidade,
          quantidade: parseInt(form.quantidade),
          estanteId: estante.id,
          x: parseInt(form.x),
          y: parseInt(form.y),
          fornecedor: form.fornecedor,
          nf: form.nf
        })
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Erro ao registrar entrada')
      }
      setSuccess(true)
      onRefresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill nome se produto já existir no inventário global
  useEffect(() => {
    if (form.produto) {
      const existing = inventory.find(p => p.code === form.produto)
      if (existing) setForm(p => ({ ...p, nome: existing.name }))
    }
  }, [form.produto, inventory])

  const occupiedSlots = new Set(inventory.filter(p => p.qty > 0).map(p => `${p.x},${p.y}`))
  const availableSlots: { x: number, y: number }[] = []
  for (let yy = 1; yy <= estante.y; yy++) {
    for (let xx = 1; xx <= estante.x; xx++) {
      if (!occupiedSlots.has(`${xx},${yy}`)) availableSlots.push({ x: xx, y: yy })
    }
  }

  const isFull = availableSlots.length === 0

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#064e3b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowDownCircle size={18} color="#34d399" />
            </div>
            <h2 style={{ margin: 0, fontSize: 17, color: '#f3f4f6' }}>Registrar Entrada na {estante.nome}</h2>
          </div>
          <button onClick={onClose} style={closeBtn}><X size={18} /></button>
        </div>
        
        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ color: '#34d399', fontWeight: 600, fontSize: 15, margin: 0 }}>Entrada registrada com sucesso!</p>
            <button onClick={onClose} style={{ ...btnPrimary, marginTop: 20, background: '#10b981' }}>Fechar</button>
          </div>
        ) : isFull ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#f3f4f6', fontWeight: 500, fontSize: 15, margin: 0 }}>Esta estante está cheia.</p>
            <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 8 }}>Não há vagas disponíveis na {estante.nome}.</p>
            <button onClick={onClose} style={{ ...btnSecondary, marginTop: 20 }}>Voltar</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Produto / Código *</label>
                <input style={inputStyle} placeholder="Ex: HW-001" value={form.produto} onChange={e => handle('produto', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Nome do Produto</label>
                <input style={inputStyle} placeholder="Nome (se for novo)" value={form.nome} onChange={e => handle('nome', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Data Validade</label>
                <input style={inputStyle} type="date" value={form.dataValidade} onChange={e => handle('dataValidade', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Quantidade *</label>
                <input style={inputStyle} type="number" min={1} placeholder="0" value={form.quantidade} onChange={e => handle('quantidade', e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={labelStyle}>Posição Livre (X,Y) *</label>
                <select style={inputStyle} value={`${form.x},${form.y}`} onChange={e => {
                  const [vx, vy] = e.target.value.split(',')
                  handle('x', vx); handle('y', vy)
                }}>
                  <option value=",">Selecionar vaga livre...</option>
                  {availableSlots.map(s => <option key={`${s.x},${s.y}`} value={`${s.x},${s.y}`}>Posição: ({s.x}, {s.y})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={submit} disabled={loading || !form.produto || !form.x || !form.quantidade} style={{ ...btnPrimary, background: '#10b981', opacity: (loading || !form.produto || !form.x || !form.quantidade) ? 0.5 : 1 }}>
                {loading ? 'Processando...' : 'Confirmar entrada'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Modal Extração Interativa ────────────────────────────────────────────────
function ModalExtracaoFlow({ product, estante, onClose, onRefresh, robotStatus }: { product: Product, estante: Estante, onClose: () => void, onRefresh: () => void, robotStatus: any }) {
  const [step, setStep] = useState<'MOVING_TO_SLOT' | 'EXTRACTING' | 'RETURNING' | 'FINISHED'>('MOVING_TO_SLOT')
  const [extractedQty, setExtractedQty] = useState('')
  const [loading, setLoading] = useState(false)
  const robotId = estante.robot?.id || 'ROB-01'

  // Etapa 1: Enviar robô para a estante logo que o modal abre
  useEffect(() => {
    fetch(`http://localhost:8080/api/robots/${robotId}/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'move', targetX: product.x, targetY: product.y })
    }).catch(e => console.error(e))
  }, [])

  // Etapa 2: Escutar WS para avançar passos
  useEffect(() => {
    if (!robotStatus) return
    // Se o robô finalizar o primeiro movimento (buscou pallet e trouxe pra base)
    if (step === 'MOVING_TO_SLOT' && robotStatus.status === 'finalizado') {
      setStep('EXTRACTING')
    }
    // Se o robô finalizar o movimento de devolução do pallet
    if (step === 'RETURNING' && robotStatus.status === 'finalizado') {
      setStep('FINISHED')
    }
  }, [robotStatus, step])

  const handleConfirmExtraction = async () => {
    const qty = parseInt(extractedQty)
    if (isNaN(qty) || qty <= 0 || qty > product.qty) {
      alert('Quantidade inválida')
      return
    }

    setLoading(true)
    try {
      // Registrar saída no banco
      const res = await fetch('http://localhost:8080/api/produtos/saida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produto: product.code,
          quantidade: qty,
          estanteId: estante.id,
          x: product.x,
          y: product.y
        })
      })

      if (!res.ok) throw new Error("Erro na baixa de estoque")

      if (qty < product.qty) {
        // Se não tirou tudo, manda robô guardar o pallet de volta
        setStep('RETURNING')
        await fetch(`http://localhost:8080/api/robots/${robotId}/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'move', targetX: product.x, targetY: product.y })
        })
      } else {
        // Tirou tudo, acabou
        setStep('FINISHED')
      }
      onRefresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        {step === 'MOVING_TO_SLOT' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ border: '4px solid rgba(59, 130, 246, 0.3)', borderTopColor: '#3b82f6', borderRadius: '50%', width: 48, height: 48, animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h3 style={{ color: '#f3f4f6', fontSize: 18, margin: '0 0 8px 0' }}>Buscando Pallet...</h3>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>O robô está se dirigindo até a posição <b>({product.x}, {product.y})</b>.</p>
            <p style={{ color: '#6b7280', fontSize: 13, marginTop: 16 }}>Aguarde a chegada na base.</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {step === 'EXTRACTING' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <Package size={24} color="#f59e0b" />
              <h2 style={{ margin: 0, fontSize: 18, color: '#f3f4f6' }}>Pallet na Base</h2>
            </div>
            <p style={{ color: '#d1d5db', fontSize: 14, marginBottom: 24 }}>
              O produto <b>{product.name} ({product.qty} un.)</b> está na base de carregamento. Quantas unidades você retirou do pallet?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={labelStyle}>Unidades Extraídas (Max: {product.qty})</label>
              <input style={inputStyle} type="number" min={1} max={product.qty} placeholder={`Ex: ${product.qty}`} value={extractedQty} onChange={e => setExtractedQty(e.target.value)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button onClick={onClose} style={btnSecondary}>Cancelar</button>
              <button onClick={handleConfirmExtraction} disabled={loading || !extractedQty} style={{ ...btnPrimary, background: '#3b82f6' }}>
                {loading ? 'Processando...' : 'Confirmar e Devolver'}
              </button>
            </div>
          </div>
        )}

        {step === 'RETURNING' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ border: '4px solid rgba(16, 185, 129, 0.3)', borderTopColor: '#10b981', borderRadius: '50%', width: 48, height: 48, animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h3 style={{ color: '#f3f4f6', fontSize: 18, margin: '0 0 8px 0' }}>Devolvendo Pallet...</h3>
            <p style={{ color: '#9ca3af', fontSize: 14 }}>O robô está retornando com o saldo para a estante.</p>
          </div>
        )}

        {step === 'FINISHED' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CheckCircle size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#10b981', fontWeight: 600, fontSize: 16, margin: 0 }}>Operação Concluída!</p>
            <button onClick={onClose} style={{ ...btnPrimary, marginTop: 24, background: '#10b981' }}>Fechar</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function Estoque() {
  const navigate = useNavigate()
  
  // Estado Globais de Contexto
  const [armazens, setArmazens] = useState<Armazem[]>([])
  const [estantes, setEstantes] = useState<Estante[]>([])
  const [activeArmazemId, setActiveArmazemId] = useState<string>('')
  const [activeEstante, setActiveEstante]     = useState<Estante | null>(null)
  
  // Estado UI
  const [viewMode, setViewMode]             = useState<'list' | 'matrix'>('list')
  const [modalEntrada, setModalEntrada]     = useState(false)
  const [extractingProduct, setExtractingProduct] = useState<Product | null>(null)
  
  const [search, setSearch]                 = useState('')
  const [inventory, setInventory]           = useState<Product[]>([])
  const [robotStatus, setRobotStatus]       = useState<any>(null)
  const [selectedPallet, setSelectedPallet] = useState<Product | null>(null)

  // 1. Carregar Armazéns
  useEffect(() => {
    fetch('http://localhost:8080/api/armazens')
      .then(res => res.json())
      .then(data => {
        setArmazens(data)
        if (data.length > 0) setActiveArmazemId(data[0].id)
      })
      .catch(err => console.error("Sem armazéns", err))
  }, [])

  // 2. Carregar Estantes quando Armazém mudar
  useEffect(() => {
    if (!activeArmazemId) return
    fetch(`http://localhost:8080/api/armazens/${activeArmazemId}/estantes`)
      .then(res => res.json())
      .then((data: Estante[]) => {
        setEstantes(data)
        if (data.length > 0) setActiveEstante(data[0])
        else setActiveEstante(null)
      })
  }, [activeArmazemId])

  // 3. Carregar Produtos quando Estante mudar
  const loadInventory = () => {
    if (!activeEstante) return setInventory([])
    fetch(`http://localhost:8080/api/estantes/${activeEstante.id}/produtos`)
      .then(res => res.json())
      .then(data => setInventory(data))
  }

  useEffect(() => {
    loadInventory()
    setSelectedPallet(null)
  }, [activeEstante])

  // Telemetria Websocket
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/telemetry')
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setRobotStatus(data)
      } catch (e) {}
    }
    return () => ws.close()
  }, [])

  const filtered = inventory.filter(item => {
    return item.name.toLowerCase().includes(search.toLowerCase()) ||
           item.code.toLowerCase().includes(search.toLowerCase())
  })

  // Matriz render logic:
  // User req: 1,1 is BOTTOM RIGHT. 
  // Cols=X, Rows=Y. visually left is X_max, right is X=1. visually top is Y_max, bottom is Y=1.
  const renderMatrix = () => {
    if (!activeEstante) return null
    const { x: cols, y: rows } = activeEstante
    
    const gridItems = []
    for (let rIndex = 0; rIndex < rows; rIndex++) {
      const yy = rows - rIndex // y goes from Max to 1
      for (let cIndex = 0; cIndex < cols; cIndex++) {
        const xx = cols - cIndex // x goes from Max to 1
        
        const item = inventory.find(p => p.x === xx && p.y === yy && p.qty > 0)
        gridItems.push(
          <div
            key={`${xx}-${yy}`}
            onClick={() => item && setSelectedPallet(item)}
            style={{
              background: item ? '#1f2937' : '#111827',
              border: `2px solid ${selectedPallet?.id === item?.id ? '#3b82f6' : '#374151'}`,
              borderRadius: 8,
              height: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: item ? 'pointer' : 'default',
              position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>({xx},{yy})</span>
            {item ? (
              <>
                <Package size={28} color="#f59e0b" style={{ marginBottom: 4 }} />
                <span style={{ fontSize: 12, color: '#f3f4f6', fontWeight: 600 }}>{item.code}</span>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#4b5563' }}>Vazio</span>
            )}
          </div>
        )
      }
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: 20, background: '#030712', borderRadius: 12, border: '1px solid #1f2937' }}>
        {gridItems}
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* Topbar */}
      <div className={styles.topbar} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>Estoque</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111827', padding: '6px 12px', borderRadius: 8, border: '1px solid #374151' }}>
            <Database size={16} color="#9ca3af" />
            <select 
              style={{ background: 'transparent', border: 'none', color: '#f3f4f6', outline: 'none', fontWeight: 500, fontSize: 14 }}
              value={activeArmazemId}
              onChange={e => setActiveArmazemId(e.target.value)}
            >
              {armazens.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
            </select>
          </div>
        </div>

        {robotStatus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111827', padding: '6px 16px', borderRadius: 20, border: '1px solid #374151' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: robotStatus.status === 'finalizado' ? '#10b981' : '#fbbf24', boxShadow: '0 0 8px #fbbf24' }}></div>
            <span style={{ fontSize: 13, color: '#f3f4f6', fontWeight: 500 }}>
              Robô: {robotStatus.status.toUpperCase()} {robotStatus.status === 'movendo' || robotStatus.status === 'retornando' ? `(X:${robotStatus.x}, Y:${robotStatus.y})` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Card principal */}
      <div className={styles.card}>

        {/* Barra de ações e seletor de Estante */}
        <div className={styles.actionBar} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className={styles.backBtn} onClick={() => navigate('/dashboard')} style={{ padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <ArrowLeft size={16} /> Voltar
            </button>

            {estantes.length > 0 && (
              <select 
                style={{ ...inputStyle, width: 'auto', minWidth: 200, padding: '8px 12px' }}
                value={activeEstante?.id || ''}
                onChange={e => {
                  const est = estantes.find(es => es.id === e.target.value)
                  if(est) setActiveEstante(est)
                }}
              >
                {estantes.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={styles.toggleGroup} style={{ display: 'flex', background: '#111827', borderRadius: 8, border: '1px solid #374151', padding: 4 }}>
              <button onClick={() => setViewMode('list')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: viewMode === 'list' ? '#374151' : 'transparent', color: viewMode === 'list' ? '#fff' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
                <List size={16} /> Lista
              </button>
              <button onClick={() => setViewMode('matrix')} style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: viewMode === 'matrix' ? '#374151' : 'transparent', color: viewMode === 'matrix' ? '#fff' : '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
                <LayoutGrid size={16} /> Matriz
              </button>
            </div>
            <button onClick={() => setModalEntrada(true)} disabled={!activeEstante} style={{ ...btnPrimary, background: activeEstante ? '#10b981' : '#374151', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} /> Novo Produto
            </button>
          </div>
        </div>

        {!activeEstante ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>Nenhuma estante disponível no armazém selecionado.</div>
        ) : (
          <>
            {/* ── LISTA ── */}
            {viewMode === 'list' && (
              <div className={styles.inventoryCard}>
                <div className={styles.filters} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: 12, top: 10 }} />
                    <input type="text" placeholder="Buscar por nome ou código..." style={{ ...inputStyle, paddingLeft: 36 }} value={search} onChange={e => setSearch(e.target.value)} />
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af', fontSize: 13 }}>
                      <th style={{ padding: '12px 16px' }}>Código</th>
                      <th style={{ padding: '12px 16px' }}>Produto</th>
                      <th style={{ padding: '12px 16px' }}>Posição</th>
                      <th style={{ padding: '12px 16px' }}>Qtd</th>
                      <th style={{ padding: '12px 16px' }}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Vazio.</td></tr>
                    ) : filtered.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #1f2937' }}>
                        <td style={{ padding: '12px 16px', color: '#f3f4f6', fontWeight: 600 }}>{item.code}</td>
                        <td style={{ padding: '12px 16px', color: '#d1d5db' }}>{item.name}</td>
                        <td style={{ padding: '12px 16px' }}><span style={{ background: '#374151', padding: '4px 8px', borderRadius: 6, fontSize: 12, color: '#d1d5db' }}>({item.x}, {item.y})</span></td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>{item.qty}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => setExtractingProduct(item)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Extrair</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── MATRIZ ── */}
            {viewMode === 'matrix' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
                {renderMatrix()}

                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                  {selectedPallet ? (
                    <>
                      <h3 style={{ margin: '0 0 20px 0', fontSize: 16, color: '#f3f4f6', borderBottom: '1px solid #1f2937', paddingBottom: 12 }}>Detalhes da Vaga</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9ca3af' }}>Posição</span><strong style={{ color: '#f3f4f6' }}>({selectedPallet.x}, {selectedPallet.y})</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9ca3af' }}>Código</span><strong style={{ color: '#f3f4f6' }}>{selectedPallet.code}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9ca3af' }}>Produto</span><strong style={{ color: '#f3f4f6' }}>{selectedPallet.name}</strong></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#9ca3af' }}>Quantidade</span><strong style={{ color: '#10b981' }}>{selectedPallet.qty} un.</strong></div>
                      </div>
                      <button
                        style={{ ...btnPrimary, background: '#3b82f6', width: '100%', marginTop: 24 }}
                        onClick={() => setExtractingProduct(selectedPallet)}
                      >
                        Solicitar Extração Autônoma
                      </button>
                    </>
                  ) : (
                    <p style={{ color: '#6b7280', fontSize: 14, textAlign: 'center', marginTop: 40 }}>Selecione um slot na matriz para ver os detalhes.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {modalEntrada && activeEstante && (
        <ModalEntrada onClose={() => setModalEntrada(false)} inventory={inventory} estante={activeEstante} onRefresh={loadInventory} />
      )}

      {extractingProduct && activeEstante && (
        <ModalExtracaoFlow
          product={extractingProduct}
          estante={activeEstante}
          onClose={() => { setExtractingProduct(null); loadInventory(); }}
          onRefresh={loadInventory}
          robotStatus={robotStatus}
        />
      )}
    </div>
  )
}