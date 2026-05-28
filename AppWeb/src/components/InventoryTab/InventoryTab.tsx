import { useState } from 'react';
import styles from './InventoryTab.module.css';
import { 
  List, 
  LayoutGrid, 
  Search, 
  Calendar, 
  Package, 
  AlertCircle 
} from 'lucide-react';

// Dados simulados para o estoque
const mockInventory = [
  { id: 1, name: 'Microcontrolador ESP32', code: 'HW-001', entryDate: '2026-04-10', valDate: 'N/A', position: '1A1', qty: 150 },
  { id: 2, name: 'Sensor Ultrassônico HC-SR04', code: 'SN-022', entryDate: '2026-04-15', valDate: 'N/A', position: '1A3', qty: 80 },
  { id: 3, name: 'Resina Epóxi (Litro)', code: 'CH-105', entryDate: '2026-03-20', valDate: '2027-03-20', position: '1B2', qty: 15 },
  { id: 4, name: 'Bateria Li-Po 3S', code: 'BT-900', entryDate: '2026-04-01', valDate: '2028-01-01', position: '1C4', qty: 30 },
];

// Estrutura física da prateleira (3 andares, 4 colunas)
const shelfPositions = [
  '1C1', '1C2', '1C3', '1C4', // Andar Superior
  '1B1', '1B2', '1B3', '1B4', // Andar do Meio
  '1A1', '1A2', '1A3', '1A4'  // Andar Inferior
];

const InventoryTab = ({ onRequestRemoval }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'matrix'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPallet, setSelectedPallet] = useState(null);

  // Filtro simples para a lista
  const filteredInventory = mockInventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ação de Retirada
  const handleRetirada = (item) => {
    // Se o onRequestRemoval for passado pelo Dashboard principal, ele ativa o robô
    if (onRequestRemoval) {
      onRequestRemoval(item.position);
    } else {
      alert(`Ordem de retirada enviada para o robô: Posição ${item.position} (${item.name})`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho e Toggle de Visão */}
      <header className={styles.header}>
        <h2 style={{ margin: 0, color: '#111827' }}>Inventário Ativo</h2>
        
        <div className={styles.toggleGroup}>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={18} /> Lista
          </button>
          <button 
            className={`${styles.toggleBtn} ${viewMode === 'matrix' ? styles.active : ''}`}
            onClick={() => setViewMode('matrix')}
          >
            <LayoutGrid size={18} /> Matriz
          </button>
        </div>
      </header>

      {/* ==============================================
          VISÃO 1: LISTA (Filtros e Tabela)
          ============================================== */}
      {viewMode === 'list' && (
        <div>
          <div className={styles.filters}>
            <div className={styles.inputGroup}>
              <Search size={18} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou código..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: '0 1 250px' }}>
              <Calendar size={18} color="#9ca3af" />
              <input type="date" title="Data de Entrada" />
            </div>
            <div className={styles.inputGroup} style={{ flex: '0 1 250px' }}>
              <AlertCircle size={18} color="#9ca3af" />
              <input type="date" title="Data de Validade" />
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
              {filteredInventory.map(item => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 'bold' }}>{item.code}</td>
                  <td>{item.name}</td>
                  <td><span style={{ background: '#e5e7eb', padding: '2px 8px', borderRadius: '4px' }}>{item.position}</span></td>
                  <td>{item.entryDate}</td>
                  <td>{item.valDate}</td>
                  <td>
                    <button className={styles.actionBtn} onClick={() => handleRetirada(item)}>
                      Extrair
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ==============================================
          VISÃO 2: MATRIZ (Prateleiras)
          ============================================== */}
      {viewMode === 'matrix' && (
        <div className={styles.matrixWrapper}>
          
          {/* Prateleira Esquerda */}
          <div className={styles.rack}>
            {shelfPositions.map(pos => {
              const item = mockInventory.find(i => i.position === pos);
              
              if (item) {
                // Slot Ocupado
                return (
                  <div 
                    key={pos} 
                    className={styles.slot} 
                    onClick={() => setSelectedPallet(item)}
                    style={{ borderBottomColor: selectedPallet?.id === item.id ? '#10b981' : '#d1d5db' }}
                  >
                    <span className={styles.slotLabel}>{pos}</span>
                    <Package size={40} className={styles.palletIcon} color="#059669" />
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{item.code}</span>
                  </div>
                );
              }

              // Slot Vazio
              return (
                <div key={pos} className={`${styles.slot} ${styles.emptySlot}`}>
                  <span className={styles.slotLabel}>{pos}</span>
                  <span style={{ fontSize: '0.8rem' }}>Vazio</span>
                </div>
              );
            })}
          </div>

          {/* Painel Lateral de Informações (Aparece ao clicar num pallet) */}
          {selectedPallet ? (
            <div className={styles.detailsPanel}>
              <h3>Detalhes do Pallet</h3>
              
              <div className={styles.detailsRow}>
                <span style={{ color: '#6b7280' }}>Posição:</span>
                <span style={{ fontWeight: 'bold', color: '#065f46' }}>{selectedPallet.position}</span>
              </div>
              <div className={styles.detailsRow}>
                <span style={{ color: '#6b7280' }}>Produto:</span>
                <span style={{ fontWeight: 'bold' }}>{selectedPallet.name}</span>
              </div>
              <div className={styles.detailsRow}>
                <span style={{ color: '#6b7280' }}>Código:</span>
                <span>{selectedPallet.code}</span>
              </div>
              <div className={styles.detailsRow}>
                <span style={{ color: '#6b7280' }}>Quantidade:</span>
                <span>{selectedPallet.qty} un.</span>
              </div>
              <div className={styles.detailsRow}>
                <span style={{ color: '#6b7280' }}>Entrada:</span>
                <span>{selectedPallet.entryDate}</span>
              </div>

              <button 
                className={styles.actionBtn} 
                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                onClick={() => handleRetirada(selectedPallet)}
              >
                Solicitar Extração Autônoma
              </button>
            </div>
          ) : (
            <div className={styles.detailsPanel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', opacity: 0.7 }}>
              <p>Selecione um pallet na prateleira para ver as informações.</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default InventoryTab;