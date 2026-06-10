-- Seed Data for Stock Overflow (estoque-api)

-- 1. Inserir Armazéns
INSERT INTO armazens (id, nome) VALUES
('b2ad8234-8c88-4c8d-bf80-5a3b2b415a77', 'Armazém Central - São Paulo'),
('e3bd8234-8c88-4c8d-bf80-5a3b2b415a88', 'Armazém Distribuição - Rio de Janeiro');

-- 2. Inserir Robots (com produto_atual_id como NULL inicialmente)
INSERT INTO robots (id, status, produto_atual_id) VALUES
('ROB-01', 'AGUARDANDO', NULL),
('ROB-02', 'EM_MOVIMENTO', NULL),
('ROB-03', 'MANUTENCAO', NULL);

-- 3. Inserir Estantes (referenciando Armazéns e Robots)
INSERT INTO estantes (id, nome, capacidade_maxima, capacidade_atual, x, y, armazem_id, robot_id) VALUES
('EST-A', 'Estante A1', 4, 0, 2, 2, 'b2ad8234-8c88-4c8d-bf80-5a3b2b415a77', 'ROB-01');

-- 4. Inserir Produtos (referenciando Estantes)
INSERT INTO produtos (id, codigo, nome, quantidade, posicao_x, posicao_y, estante_id) VALUES
('d1e57c64-4e20-4e3f-a6bd-58fffa817340', 'PAR-M8', 'Parafusos Sextavados M8', 20, 1, 1, 'EST-A'),
('c3f57c64-4e20-4e3f-a6bd-58fffa817341', 'POR-8M', 'Porcas de Aço 8mm', 25, 1, 2, 'EST-A'),
('a5e57c64-4e20-4e3f-a6bd-58fffa817342', 'ROL-6204', 'Rolamentos de Esfera 6204', 80, 2, 1, 'EST-A');

-- 5. Atualizar Robots que estão carregando algum produto
UPDATE robots SET produto_atual_id = 'a5e57c64-4e20-4e3f-a6bd-58fffa817342' WHERE id = 'ROB-02';

-- 6. Inserir Logs Iniciais
INSERT INTO logs (id, timestamp, tipo, mensagem, estante_id, robot_id) VALUES
('f1a23b45-6c78-90d1-e2f3-a4b5c6d7e8f9', NOW() - INTERVAL '2 hours', 'INFO', 'Sistema iniciado com sucesso.', NULL, NULL),
('a2b34c56-7d89-01e2-f3a4-b5c6d7e8f9a0', NOW() - INTERVAL '1 hour', 'INFO', 'Robot ROB-01 associado à Estante EST-A.', 'EST-A', 'ROB-01'),
('b3c45d67-8e90-12f3-a4b5-c6d7e8f9a0b1', NOW() - INTERVAL '30 minutes', 'AVISO', 'Capacidade da Estante EST-A atingiu 80%.', 'EST-A', NULL),
('c4d56e78-9f01-23a4-b5c6-d7e8f9a0b1c2', NOW() - INTERVAL '10 minutes', 'LOGISTICA', 'Robot ROB-02 iniciou transporte do produto Rolamentos de Esfera 6204.', 'EST-A', 'ROB-02');

-- 7. Inserir Usuários de Exemplo
INSERT INTO usuarios (id, nome, username, cpf, password, role) VALUES
('u1ad8234-8c88-4c8d-bf80-5a3b2b415a01', 'Administrador do Sistema', 'admin', '000.000.000-00', 'admin', 'ADMIN'),
('u2bd8234-8c88-4c8d-bf80-5a3b2b415a02', 'Operador de Estoque Silva', 'osilva', '111.111.111-11', '$2a$10$8.UnVuG9HHgffUDAlk8qCOuy5fKbC2fZg.W1s24mD6.G92mN2/V.u', 'OPERADOR'),
('u3cd8234-8c88-4c8d-bf80-5a3b2b415a03', 'Técnico de Robótica Costa', 'tcosta', '222.222.222-22', '$2a$10$8.UnVuG9HHgffUDAlk8qCOuy5fKbC2fZg.W1s24mD6.G92mN2/V.u', 'TECNICO');
