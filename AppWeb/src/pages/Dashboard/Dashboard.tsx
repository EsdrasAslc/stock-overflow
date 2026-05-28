"use client";

import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { 
  PlusCircle, 
  MinusCircle, 
  Package, 
  Camera, 
  Loader2, 
  ArrowLeft,
  Save
} from 'lucide-react';
import RobotStatus from '@/components/Dashboard/RobotStatus/RobotStatus';
import InventoryTab from '@/components/InventoryTab/InventoryTab';

const Dashboard = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [operationStatus, setOperationStatus] = useState('Aguardando comandos...');
  const [isSearching, setIsSearching] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' ou 'inventory'
  const [productsData, setProductsData] = useState<any[]>([])
  console.log(productsData)

  // Estados para controlar o formulário do modal
  const [skuBusca, setSkuBusca] = useState('');
  const [produtoEncontrado, setProdutoEncontrado] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    marca: '',
    tipo: '',
    validade: ''
  });

  // Função disparada toda vez que o input de SKU muda
  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    setSkuBusca(valorDigitado);

    // Busca no array de produtos existentes
    const produto = productsData.find(
      (p) => String(p.cod_produto) === String(valorDigitado)
    );

    if (produto) {
      // Se achou, preenche os dados e sinaliza que é atualização
      setForm((prev) => ({
        ...prev,
        nome: produto.nome_produto,
        marca: produto.marca_produto,
        tipo: produto.tipo_produto,
      }));
      setProdutoEncontrado(true);
    } else {
      // Se não achou, limpa os campos para um novo cadastro (mantendo a validade digitada)
      setForm((prev) => ({
        ...prev,
        nome: '',
        marca: '',
        tipo: '',
      }));
      setProdutoEncontrado(false);
    }
  };

  // Função genérica para atualizar os inputs do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvarEstoque = () => {
    const payload = {
      cod_produto: Number(skuBusca),
      nome_produto: form.nome,
      marca_produto: form.marca,
      tipo_produto: form.tipo,
      validade_lote: form.validade,
      isAtualizacao: produtoEncontrado // Flag útil para enviar para a sua API
    };

    console.log("Enviando para o backend:", payload);
    // Aqui você chama o seu endpoint (ex: fetch('/api/produto/create', ...))
  };

  // FETCHS

  const buscaProdutosBanco = async () => {
    try {
      const resProduto = await fetch("/api/produto/get-all", {
        cache: "no-store",
      })
      const dataProduto = await resProduto.json()

      if (dataProduto.success) {
        setProductsData(dataProduto.products)
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    }
  }

  // Simulação da lógica de busca do robô
  const handleRequestPallet = (posicao: string) => {
    setActiveModal(null);
    setIsSearching(true);
    setOperationStatus(`Robô em movimento para a posição ${posicao}...`);
    
    setTimeout(() => {
      setIsSearching(false);
      setOperationStatus(`Pallet da posição ${posicao} entregue na zona de retirada.`);
    }, 4000);
  };

  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscaProdutosBanco()
  }, [])
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>Estoque Autônomo</h1>
        <p style={{ color: '#666' }}>Painel de Comando Central</p>
      </header>

      {/* ==========================================
          RENDERIZAÇÃO CONDICIONAL DAS TELAS
          ========================================== */}
      
      {currentView === 'home' ? (
        // TELA INICIAL: Cards de Ação
        <section className={styles.actionGrid}>
          <div className={`${styles.card} ${styles.cardAdd}`} onClick={() => setActiveModal('add')}>
            <PlusCircle size={32} color="#10b981" />
            <h3 style={{ margin: 0, color: '#064e3b' }}>Entrada de Produto</h3>
            <p style={{ margin: 0, color: '#059669', fontSize: '0.9rem' }}>Scan ou cadastro manual</p>
          </div>

          <div className={`${styles.card} ${styles.cardRemove}`} onClick={() => setActiveModal('remove')}>
            <MinusCircle size={32} color="#ef4444" />
            <h3 style={{ margin: 0, color: '#7f1d1d' }}>Saída de Produto</h3>
            <p style={{ margin: 0, color: '#b91c1c', fontSize: '0.9rem' }}>Localizar e solicitar retirada</p>
          </div>

          {/* NOVO: Evento de clique para mudar de tela */}
          <div className={`${styles.card} ${styles.cardInventory}`} onClick={() => setCurrentView('inventory')}>
            <Package size={32} color="#3b82f6" />
            <h3 style={{ margin: 0, color: '#1e3a8a' }}>Aba de Estoque</h3>
            <p style={{ margin: 0, color: '#2563eb', fontSize: '0.9rem' }}>Inventário e mapeamento</p>
          </div>
        </section>
      ) : (
        // TELA DE ESTOQUE: Componente InventoryTab
        <div>
          <button className={styles.backBtn} onClick={() => setCurrentView('home')}>
            <ArrowLeft size={20} /> Voltar ao Início
          </button>
          
          {/* Passamos a função de retirada como prop para a aba de estoque poder acionar o robô */}
          <InventoryTab onRequestRemoval={handleRequestPallet} />
        </div>
      )}

      {/* ==========================================
          TELEMETRIA E MODAIS
          ========================================== */}

      {/* O Status fica fora da condição, logo ele NUNCA some da tela */}
      <RobotStatus isSearching={isSearching} operationStatus={operationStatus} />

      {/* Modal: Adicionar */}
      {activeModal === 'add' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: '#064e3b', marginBottom: '1rem' }}>
              Registrar Entrada de Lote
            </h2>
            
            {/* Linha de Busca SKU */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
              <input
                type="number"
                placeholder="Código SKU..."
                value={skuBusca}
                onChange={handleSkuChange}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #10b981', outline: 'none' }}
              />
              <button style={{ background: '#10b981', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                <Camera size={20} />
              </button>
            </div>

            {/* Formulário de Dados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '14px', color: '#064e3b', fontWeight: 'bold' }}>Nome do Produto</label>
                <input
                  type="text"
                  name="nome"
                  value={form.nome}
                  onChange={handleFormChange}
                  placeholder="Ex: Pneu slick"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', color: '#064e3b', fontWeight: 'bold' }}>Marca</label>
                  <input
                    type="text"
                    name="marca"
                    value={form.marca}
                    onChange={handleFormChange}
                    placeholder="Ex: Pirelli"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '14px', color: '#064e3b', fontWeight: 'bold' }}>Tipo</label>
                  <input
                    type="text"
                    name="tipo"
                    value={form.tipo}
                    onChange={handleFormChange}
                    placeholder="Ex: Não perecível"
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '14px', color: '#064e3b', fontWeight: 'bold' }}>Validade do Lote</label>
                <input
                  type="date"
                  name="validade"
                  value={form.validade}
                  onChange={handleFormChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '5px' }}
                />
              </div>

              {/* Mensagem de Feedback Visual */}
              {produtoEncontrado && skuBusca.length > 0 && (
                <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
                  ✓ Produto existente encontrado. Você pode atualizar os dados se necessário.
                </span>
              )}
              {!produtoEncontrado && skuBusca.length > 0 && (
                <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 'bold' }}>
                  ⚠ Produto não cadastrado. Um novo registro será criado.
                </span>
              )}

              {/* Botão de Submissão */}
              <button 
                onClick={handleSalvarEstoque}
                style={{ 
                  background: '#064e3b', 
                  color: 'white', 
                  padding: '14px', 
                  borderRadius: '8px', 
                  border: 'none', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold',
                  marginTop: '10px'
                }}
              >
                <Save size={20} />
                Guardar lote no estoque
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal: Remover */}
      {activeModal === 'remove' && (
        <div className={styles.modalOverlay} onClick={() => setActiveModal(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: '#7f1d1d' }}>Solicitar Retirada</h2>
            <input 
              type="text" 
              placeholder="Nome ou código da peça..." 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ef4444', marginTop: '1rem', boxSizing: 'border-box' }} 
            />
            <div style={{ marginTop: '1.5rem', background: '#fef2f2', padding: '1rem', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.9rem', color: '#b91c1c', marginBottom: '10px', fontWeight: 'bold' }}>Em estoque nestas posições:</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleRequestPallet('1C2')}
                  style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Extrair 1C2
                </button>
                <button 
                  onClick={() => handleRequestPallet('1B7')}
                  style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Extrair 1B7
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>);
};

export default Dashboard;