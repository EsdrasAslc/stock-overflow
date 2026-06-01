import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Search, Calendar, AlertCircle, List, LayoutGrid, ArrowLeft, Plus } from 'lucide-react'
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

export default function Estoque() {
  const navigate = useNavigate()
  const [viewMode, setViewMode]             = useState<'list' | 'matrix'>('list')
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
    </div>
  )
}