# 📦 Stock Overflow

> Sistema de gerenciamento de estoque com suporte a robôs automatizados para movimentação de produtos.

---

## 🚀 Visão Geral

O **Stock Overflow** é uma plataforma full-stack para controle de estoque inteligente. Ele combina uma API REST robusta no backend com uma interface web moderna no frontend, permitindo o gerenciamento de armazéns, estantes, produtos e movimentações realizadas por robôs autônomos.

---

## 🏗️ Arquitetura do Projeto

```
stock-overflow/
├── Backend/        # API REST — Spring Boot + PostgreSQL
└── AppWeb/         # Interface Web — React + TypeScript + Vite
```

---

## 🖥️ Backend

### Tecnologias

| Tecnologia | Versão |
|---|---|
| Java | 26 |
| Spring Boot | 4.0.6 |
| Spring Data JPA | — |
| PostgreSQL | — |
| Lombok | 1.18.46 |
| Maven | — |

### Principais Entidades

- **Armazem** — Representa o armazém físico
- **Estante** — Prateleiras/locais dentro do armazém
- **Produto** — Itens armazenados nas estantes
- **Robot** — Robôs responsáveis pela movimentação
- **RobotMoviment** — Registro de movimentações realizadas pelos robôs
- **Usuario** — Usuários do sistema com controle de acesso por roles
- **Log** — Histórico de ações no sistema

### Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/robot-moviments` | Lista todas as movimentações |
| `GET` | `/api/robot-moviments/{id}` | Busca movimentação por ID |
| `GET` | `/api/robots/{robotId}/moviments` | Lista movimentações por robô |
| `POST` | `/api/robot-moviments` | Cria nova movimentação |
| `DELETE` | `/api/robot-moviments/{id}` | Remove uma movimentação |

> Outros endpoints disponíveis para: Armazéns, Estantes, Produtos, Robôs, Usuários e Logs.

### Configuração e Execução

**1. Pré-requisitos**
- Java 21+
- PostgreSQL rodando localmente
- Maven

**2. Configurar variáveis de ambiente**

Crie (ou edite) o arquivo `Backend/.env`:

```env
DB_URL=jdbc:postgresql://localhost:5432/estoque_db
DB_USERNAME=postgres
DB_PASSWORD=admin
SERVER_PORT=8080
```

**3. Criar o banco de dados**

```sql
CREATE DATABASE estoque_db;
```

**4. Rodar a aplicação**

```bash
cd Backend
./mvnw spring-boot:run
```

A API estará disponível em: `http://localhost:8080`

---

## 🌐 Frontend (AppWeb)

### Tecnologias

| Tecnologia | Versão |
|---|---|
| React | 19 |
| TypeScript | 6 |
| Vite | 8 |
| React Router DOM | 7 |
| Lucide React | — |

### Páginas

| Rota | Descrição |
|---|---|
| `/login` | Autenticação de usuários |
| `/dashboard` | Painel principal com visão geral |
| `/estoque` | Gerenciamento de produtos e estantes |
| `/movimentacao` | Controle de movimentações de robôs |

> Todas as rotas (exceto `/login`) são protegidas e requerem sessão ativa.

### Configuração e Execução

**1. Pré-requisitos**
- Node.js 18+
- npm

**2. Instalar dependências**

```bash
cd AppWeb
npm install
```

**3. Rodar em modo desenvolvimento**

```bash
npm run dev
```

A aplicação estará disponível em: `http://localhost:5173`

---

## ⚙️ Rodando o Projeto Completo

1. Inicie o PostgreSQL e crie o banco `estoque_db`
2. Suba o backend: `cd Backend && ./mvnw spring-boot:run`
3. Suba o frontend: `cd AppWeb && npm run dev`
4. Acesse `http://localhost:5173` no navegador

---

## 📂 Estrutura do Backend

```
Backend/src/main/java/com/stockoverflow/estoque_api/
├── controller/     # Controladores REST
├── service/        # Regras de negócio
├── repository/     # Acesso ao banco de dados
├── model/          # Entidades JPA
├── dto/            # Data Transfer Objects
└── config/         # Configurações da aplicação
```

---

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b feature/minha-feature`
3. Commit suas alterações: `git commit -m 'feat: adiciona minha feature'`
4. Push para a branch: `git push origin feature/minha-feature`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.