# Visão Geral do Projeto Leadsflow

Este documento descreve a arquitetura e as tecnologias utilizadas no projeto Leadsflow, uma aplicação para gerenciamento de campanhas de marketing.

## 1. Visão Geral da Aplicação

O Leadsflow é uma plataforma que permite aos usuários criar, gerenciar e acompanhar campanhas de marketing, com foco na criação de campanhas e interação com audiências e templates.

## 2. Arquitetura

A aplicação é dividida em duas partes principais:

*   **Frontend (Interface do Usuário):** Desenvolvido em React, responsável pela interação do usuário e exibição dos dados.
*   **Backend (API):** Desenvolvido em Node.js com Express.js, responsável pela lógica de negócio, persistência de dados e comunicação com serviços externos.

### 2.1. Frontend

O frontend é uma Single Page Application (SPA) construída com React. Um ponto arquitetural importante é a **isolamento do "Campaign Wizard" (assistente de criação de campanha)**.

*   **Tecnologias Principais:**
    *   **React:** Biblioteca JavaScript para construção de interfaces de usuário.
    *   **Vite:** Ferramenta de build para desenvolvimento frontend rápido.
    *   **Tailwind CSS:** Framework CSS utilitário para estilização rápida e responsiva.
    *   **Radix UI (provável):** Utilizado para componentes de UI acessíveis e de alta qualidade (como Toasts e Dropdown Menus), que foram a causa de conflitos de DOM no passado.
    *   **`react-router-dom`:** Para roteamento no lado do cliente.
    *   **`lucide-react`:** Biblioteca de ícones.

*   **Isolamento do Campaign Wizard (`<iframe>`):**
    *   Para resolver um problema persistente de conflito de DOM (`Uncaught NotFoundError: Failed to execute 'removeChild' on 'Node'`) entre o React e componentes baseados em portal (como Toasts) da aplicação principal, o "Campaign Wizard" foi isolado dentro de um `<iframe>`.
    *   A página principal (`src/pages/CreateCampaign.jsx`) agora atua como um host que renderiza o `<iframe>`.
    *   O wizard isolado (`src/pages/IsolatedCreateCampaign.jsx`) é uma aplicação React autônoma, com seus próprios pontos de entrada (`create-campaign.html`, `src/create-campaign-main.jsx`).
    *   **Comunicação:** A comunicação entre o `<iframe>` e a página principal é feita via `window.parent.postMessage` (ex: para notificar o lançamento de uma campanha).
    *   **Autenticação:** O token de autenticação (`leadflow_token` do `localStorage`) é passado para o `<iframe>` via URL para que o wizard isolado possa fazer suas próprias requisições autenticadas.

### 2.2. Backend

O backend é uma API RESTful construída com Node.js e Express.js.

*   **Tecnologias Principais:**
    *   **Node.js:** Ambiente de execução JavaScript.
    *   **Express.js:** Framework web para Node.js, utilizado para construir a API.
    *   **Prisma:** ORM (Object-Relational Mapper) para Node.js e TypeScript, utilizado para interagir com o banco de dados.
    *   **PostgreSQL:** Banco de dados relacional (inferido pelo `provider = "postgresql"` no `schema.prisma`).
    *   **`dotenv`:** Para gerenciamento de variáveis de ambiente.

*   **Estrutura de Dados (Prisma Schema):**
    *   **`User`:** Modelo para usuários da aplicação (email, nome, senha, timestamps).
    *   **`Template`:** Modelo para templates de mensagens (nome, corpo, variáveis, status, categoria, etc.).
    *   **`Audience`:** Modelo para listas de contatos (nome, arquivo, contagem de contatos, campos dinâmicos).
    *   **`Contact`:** Modelo para contatos dentro de uma audiência (telefone, dados JSON dinâmicos).
    *   **`Campaign`:** Modelo principal para campanhas (nome, status, agendamento, links para `User`, `Audience`, `Template`).

*   **Rotas da API (`backend/routes/`):**
    *   **`audiences.js`:** Gerenciamento de audiências.
    *   **`auth.js`:** Lógica de autenticação.
    *   **`campaigns.js`:** Gerenciamento de campanhas (criação, listagem, exclusão, e a nova funcionalidade de envio manual).
    *   **`templates.js`:** Gerenciamento de templates (incluindo a correção de `upsert` para sincronização de templates Gupshup).

*   **Funcionalidades Específicas do Backend:**
    *   **Criação de Campanha:** Suporta criação de campanhas com status "Draft" (rascunho) ou "Scheduled" (agendada). A opção "Enviar Imediatamente" foi substituída por "Enviar Manualmente", que cria a campanha como "Draft".
    *   **Envio Manual de Campanha:** Uma nova rota (`POST /campaigns/:id/send-manual`) foi adicionada para permitir que campanhas no status "Draft" sejam manualmente movidas para "Scheduled" (ou "In Progress", dependendo da implementação final do envio).
    *   **Sincronização de Templates:** A lógica de sincronização de templates (provavelmente com uma API externa como Gupshup) foi ajustada para usar `upsert` e incluir validação de dados, resolvendo um erro `500 Internal Server Error` anterior.

## 3. Ferramentas de Desenvolvimento

*   **ESLint:** Para linting de código.
*   **Prettier:** Para formatação de código.
*   **Jest:** Para testes (mencionado em `package.json` de `campaign-wizard-standalone`).
*   **Prisma Migrate:** Para gerenciar migrações de banco de dados.

Este resumo fornece uma visão abrangente do projeto Leadsflow, suas tecnologias e sua arquitetura.
