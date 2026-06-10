-- PostgreSQL Schema for Stock Overflow (estoque-api)

DROP TABLE IF EXISTS robot_moviments CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;
DROP TABLE IF EXISTS robots CASCADE;
DROP TABLE IF EXISTS estantes CASCADE;
DROP TABLE IF EXISTS armazens CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;


DROP TYPE IF EXISTS robot_status CASCADE;
DROP TYPE IF EXISTS tipo_log CASCADE;
DROP TYPE IF EXISTS usuario_role CASCADE;
DROP TYPE IF EXISTS StatusMovimentacao CASCADE;
DROP TYPE IF EXISTS tipo_movimento CASCADE;

-- Criando ENUMs
CREATE TYPE robot_status AS ENUM ('AGUARDANDO', 'EM_MOVIMENTO', 'MANUTENCAO');
CREATE TYPE StatusMovimentacao AS ENUM ('PENDENTE', 'EM_EXECUCAO', 'SUCESSO', 'FALHA');
CREATE TYPE tipo_log     AS ENUM ('INFO', 'AVISO', 'ERRO', 'LOGISTICA');
CREATE TYPE usuario_role AS ENUM ('ADMIN', 'OPERADOR', 'TECNICO');
CREATE TYPE tipo_movimento AS ENUM ('REMOVER', 'ADICIONAR', 'REALOCAR');


-- 1. Tabela armazens
CREATE TABLE armazens (
    id   VARCHAR(36)  PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

-- 2. Tabela robots
-- Nota: produto_atual_id não pode ter FK inline aqui pois produtos ainda não existe.
-- A FK é adicionada via ALTER TABLE abaixo, após a criação de produtos.
CREATE TABLE robots (
    id             VARCHAR(36)  PRIMARY KEY,
    status         robot_status NOT NULL,
    produto_atual_id VARCHAR(36)
);

-- 3. Tabela estantes
CREATE TABLE estantes (
    id               VARCHAR(36)  PRIMARY KEY,
    nome             VARCHAR(255) NOT NULL,
    capacidade_maxima INTEGER      NOT NULL,
    capacidade_atual  INTEGER      NOT NULL,
    x                INTEGER      NOT NULL DEFAULT 2,
    y                INTEGER      NOT NULL DEFAULT 2,
    armazem_id       VARCHAR(36)  NOT NULL,
    robot_id         VARCHAR(36),
    FOREIGN KEY (armazem_id) REFERENCES armazens(id) ON DELETE CASCADE,
    FOREIGN KEY (robot_id)   REFERENCES robots(id)   ON DELETE SET NULL
);

-- 4. Tabela produtos
CREATE TABLE produtos (
    id            VARCHAR(36)  PRIMARY KEY,
    codigo        VARCHAR(50)  NOT NULL,
    nome          VARCHAR(255) NOT NULL,
    categoria     VARCHAR(100),
    quantidade    INTEGER      NOT NULL,
    data_entrada  VARCHAR(20),
    data_saida    VARCHAR(20),
    data_validade VARCHAR(20),
    posicao_x     INTEGER      NOT NULL,
    posicao_y     INTEGER      NOT NULL,
    estante_id    VARCHAR(36)  NOT NULL,
    FOREIGN KEY (estante_id) REFERENCES estantes(id) ON DELETE CASCADE
);

-- 5. Tabela robot_moviments
CREATE TABLE robot_moviments (
    id                  VARCHAR(36) PRIMARY KEY,
    robot_id            VARCHAR(36) NOT NULL,
    produto_id          VARCHAR(36) NOT NULL,
    origem_estante_id   VARCHAR(36) NOT NULL,
    destino_estante_id  VARCHAR(36) NOT NULL,
    timestamp           TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    tipo_movimento      tipo_movimento NOT NULL,
    status_movimentacao StatusMovimentacao NOT NULL,
    FOREIGN KEY (robot_id)           REFERENCES robots(id)   ON DELETE CASCADE,
    FOREIGN KEY (produto_id)         REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (origem_estante_id)  REFERENCES estantes(id) ON DELETE CASCADE,
    FOREIGN KEY (destino_estante_id) REFERENCES estantes(id) ON DELETE CASCADE
);

-- 6. Tabela logs
CREATE TABLE logs (
    id              VARCHAR(36)  PRIMARY KEY,
    timestamp       TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    tipo            tipo_log     NOT NULL,
    mensagem        VARCHAR(255) NOT NULL,
    estante_id      VARCHAR(36),
    robot_id        VARCHAR(36),
    movimentacao_id VARCHAR(36),
    FOREIGN KEY (estante_id)      REFERENCES estantes(id)         ON DELETE SET NULL,
    FOREIGN KEY (robot_id)        REFERENCES robots(id)           ON DELETE SET NULL,
    FOREIGN KEY (movimentacao_id) REFERENCES robot_moviments(id)  ON DELETE SET NULL
);

-- 7. Tabela usuarios
CREATE TABLE usuarios (
    id       VARCHAR(36)   PRIMARY KEY,
    nome     VARCHAR(255)  NOT NULL,
    username VARCHAR(255)  NOT NULL UNIQUE,
    cpf      VARCHAR(14)   NOT NULL UNIQUE,
    password VARCHAR(255)  NOT NULL,
    role     usuario_role  NOT NULL
);

-- FK circular: robots -> produtos (adicionada após criação de ambas as tabelas)
ALTER TABLE robots
    ADD CONSTRAINT fk_robots_produto_atual
    FOREIGN KEY (produto_atual_id)
    REFERENCES produtos(id)
    ON DELETE SET NULL;
