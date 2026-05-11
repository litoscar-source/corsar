# Manual do Utilizador - AuditPro 360

Bem-vindo ao **AuditPro 360**, o seu sistema de gestão de relatórios de visita e auditoria técnica. Este manual irá guiá-lo através das principais funcionalidades da aplicação, desde o acesso inicial até à emissão de relatórios e gestão de clientes.

---

## Índice

1. [Acesso e Login](#1-acesso-e-login)
2. [Visão Geral (Dashboard)](#2-visão-geral-dashboard)
3. [Gestão de Clientes](#3-gestão-de-clientes)
4. [Criar e Gerir Relatórios](#4-criar-e-gerir-relatórios)
   - [Novo Relatório](#novo-relatório)
   - [Preenchimento do Relatório](#preenchimento-do-relatório)
   - [Assinatura Digital](#assinatura-digital)
   - [Visitas Comerciais (Contactos e Encomendas)](#visitas-comerciais-contactos-e-encomendas)
   - [Finalizar e Exportar](#finalizar-e-exportar)
5. [Histórico e Pesquisas](#5-histórico-e-pesquisas)
6. [Configurações](#6-configurações)
7. [Perfis de Utilizador](#7-perfis-de-utilizador)
8. [Instalação e Base de Dados (Hostinger / MySQL)](#8-instalação-e-base-de-dados-hostinger--mysql)

---

## 1. Acesso e Login

Ao abrir a aplicação, será apresentado o ecrã de seleção de utilizador. O sistema foi desenhado para ser rápido e fácil de usar em tablets.

1.  **Selecione o seu Utilizador:** Toque na sua foto ou nome na lista de utilizadores.
2.  **Introduza o PIN:** Digite o seu código PIN de 6 dígitos no teclado numérico apresentado.
3.  **Entrar:** Após introduzir os 6 dígitos, o botão "Entrar" ficará ativo. Toque nele para aceder.

> **Nota:** Se introduzir o PIN errado, aparecerá uma mensagem de erro a vermelho. Utilize o botão de retrocesso (⌫) para corrigir.

---

## 2. Visão Geral (Dashboard)

Após o login, será direcionado para o **Dashboard**. Este é o painel de controlo principal onde pode ver:

-   **Resumo do Mês:** Número de relatórios realizados e valor total de encomendas (se aplicável).
-   **Alertas de Visitas:** Lista de clientes que necessitam de visita urgente (baseado na frequência de visita definida).
-   **Atividade Recente:** Os últimos 5 relatórios emitidos pela equipa.
-   **Acesso Rápido:** Botões para navegar para Clientes, Relatórios ou Configurações.

---

## 3. Gestão de Clientes

No menu lateral, selecione **"Clientes"** para aceder à base de dados.

### Funcionalidades:
-   **Pesquisa Textual:** Utilize a barra de pesquisa no topo para encontrar clientes por Nome da Empresa ou NIF.
-   **Filtro por Localização:** Pode filtrar a lista de clientes pela localidade.
-   **Filtro de Gestor (Administradores):** Se for Administrador, pode filtrar para ver apenas os clientes associados a um determinado utilizador (Comercial/Vendedor).
-   **Novo Cliente:** Toque no botão **"+ Adicionar"** para criar uma ficha. Preencha os dados obrigatórios (Nome, Contacto, Email) e a morada.
-   **Editar Cliente:** Toque no ícone de lápis (cinzento) num cliente existente para alterar os seus dados.
-   **Histórico:** Toque no ícone de relógio (roxo) para ver todos os relatórios passados desse cliente.
-   **Iniciar Relatório:** Toque no ícone de documento (azul) para iniciar imediatamente um novo relatório para esse cliente.

> **Dica:** Defina a "Frequência de Visita (dias)" na ficha do cliente para que o sistema o avise automaticamente quando for altura de voltar.

---

## 4. Criar e Gerir Relatórios

Esta é a função principal do AuditPro 360.

### Novo Relatório
Pode iniciar um relatório de duas formas:
1.  No menu **Clientes**, clicando no ícone de documento verde no cliente desejado.
2.  No menu **Relatórios**, clicando em **"+ Novo Relatório"** e selecionando o cliente na lista.

Após selecionar o cliente, escolha o **Tipo de Relatório** (Template). Os templates disponíveis dependem do seu perfil de utilizador (ex: Auditores veem auditorias técnicas, Comerciais veem visitas comerciais).

### Preenchimento do Relatório
O formulário é intuitivo e dividido em secções:

1.  **Cabeçalho:**
    -   **Data/Hora:** Preenchidos automaticamente (editáveis).
    -   **GPS:** O sistema tenta capturar a sua localização automaticamente. Se capturado, aparece um botão "Ver Mapa".
    -   **Contrato/Rota:** Campos opcionais para referência interna.

2.  **Grelha de Avaliação (Checklist):**
    -   Para cada critério, selecione o estado:
        -   **OK (Verde):** Conforme.
        -   **NOK (Vermelho):** Não conforme.
        -   **N/A (Cinzento):** Não aplicável.
    -   Pode adicionar observações específicas para cada ponto na caixa de texto abaixo dos botões.

3.  **Resumo e Observações:**
    -   **Resumo e Conclusões:** Espaço para o parecer técnico ou resumo da visita.
    -   **Observações do Cliente:** Espaço para registar o feedback do cliente.

### Visitas Comerciais (Contactos e Encomendas)
Se selecionou o tipo **"Visita Comercial / Prospeção"**, terá acesso a secções exclusivas no formulário:

1.  **Detalhes do Contacto:**
    - Pode registar com quem falou (nome da pessoa), o telefone/telemóvel direto e o endereço de email do interlocutor dessa visita. Estes dados irão constar no cabeçalho do PDF final.

2.  **Lançamento de Produtos e Serviços:**
    -  Tem à disposição botões separados para **"Adicionar Produto"** (ex: químicos, materiais) e **"Adicionar Serviço"** (ex: mão-de-obra, deslocações).
    -  **Unidades de Medida:**
       -  Para Produtos, pode escolher a unidade: Un (Unidade), Cx (Caixa), Gr (Gramas), Kg (Quilogramas) ou L (Litros).
       -  Para Serviços, pode escolher a unidade: Un (Unidade), Hr (Horas) ou Dia (Dias).
    -   Preencha o nome/descrição, quantidade, preço unitário e desconto (se aplicável).
    -   O sistema calcula automaticamente as linhas e os totais finais com IVA (23%).
    -   Pode adicionar as condições de entrega e as observações diretas da faturação.

### Assinatura Digital
Para relatórios técnicos (não comerciais), as assinaturas são **obrigatórias**:
1.  **Técnico (Auditor):** O seu nome aparece automaticamente. Assine na caixa branca.
2.  **Cliente:** Escreva o nome da pessoa que recebe a visita e peça-lhe para assinar na caixa branca.

> **Erro:** Se tentar gravar sem assinar, o sistema emitirá um alerta.

### Finalizar e Exportar
No topo do formulário, tem várias opções:
-   **Finalizar (Gravar):** Guarda o relatório na base de dados.
-   **PDF Relatório:** Gera e descarrega o ficheiro PDF do relatório técnico.
-   **PDF Enc. (Apenas Comercial):** Gera um PDF específico apenas com a nota de encomenda.
-   **Enviar (Email):** Abre a sua aplicação de email padrão com o relatório em anexo (se suportado pelo dispositivo) ou prepara o email com o assunto e corpo pré-definidos.

---

## 5. Histórico e Pesquisas

No menu **"Relatórios"** (Histórico de Relatórios), tem acesso a todo o arquivo de documentos gerados.
Pode utilizar a barra de pesquisa no canto superior direito para procurar rapidamente um documento específico:
- Pode pesquisar pelo ID do relatório (ex: "2024-001").
- Pode pesquisar pelo Nome do Cliente.
- Pode pesquisar pelo Tipo de Relatório (ex: "HACCP", "Comercial").

Os resultados são atualizados instantaneamente em tempo real e pode visualizar o relatório e descarregar o PDF a partir desta grelha.

---

## 6. Configurações

Aceda ao menu **Configurações** (ícone de roda dentada) para gerir o sistema.
*Atenção: Algumas opções podem estar visíveis apenas para Administradores.*

-   **Dados da Empresa:** Altere o nome, morada, NIF e logótipo que aparecem no cabeçalho dos PDFs.
-   **Utilizadores:** Adicione ou remova membros da equipa e defina os seus PINs e permissões.
-   **Modelos de Relatório:** Crie novos tipos de auditoria personalizados. Pode definir o nome do relatório e a lista de critérios (perguntas) que aparecem na checklist.

---

## 7. Perfis de Utilizador

O sistema possui diferentes níveis de acesso:

-   **Administrador:** Acesso total a tudo, incluindo permissões para ver clientes de qualquer comercial e apagar registos da base de dados.
-   **Comercial:** Focado em Clientes, Visitas Comerciais e Encomendas. Vê apenas os seus clientes atribuídos.
-   **Auditor / Técnico:** Focado em Relatórios Técnicos (HACCP, Piscinas, Manutenção, etc.).

---

## 8. Instalação e Base de Dados (Hostinger / MySQL)

Este sistema foi concebido para funcionar num servidor Web tradicional suportado em **PHP 8+ e MySQL**, sendo ideal para ser alojado num serviço como a Hostinger.

### Passos de Instalação:

1. **Base de Dados:**
   - No painel da Hostinger (ou cPanel), crie uma nova base de dados MySQL juntamente com um Utilizador e Senha.
   - Aceda ao phpMyAdmin e faça **Importar** o ficheiro `database.sql` incluído no projeto. Isto criará automaticamente todas as tabelas rigorosamente necessárias (`users`, `clients`, `reports`, `report_criteria`, `order_items`, `settings`, `templates`, etc.).

2. **Configuração de Acesso:**
   - Na pasta `public/api/`, abra o ficheiro `db.php` utilizando o Gestor de Ficheiros.
   - Altere as credenciais `DB_HOST`, `DB_NAME`, `DB_USER`, e `DB_PASS` para as que criou no passo 1.

3. **Deploy (Publicação):**
   - Transfira os ficheiros compilados (depois de fazer o *build* da aplicação) para a pasta raiz (`public_html`) na Hostinger.
   - Certifique-se que a pasta `api/` (que contém os scripts PHP) também é carregada para o servidor. 
   - A aplicação fará chamadas diretamente para `/api/clients.php`, `/api/reports.php`, etc., comunicando local e diretamente com o seu servidor MySQL.

---

**Suporte Técnico:**
Em caso de dúvidas ou erros, contacte o administrador do sistema ou o suporte técnico através do email indicado no rodapé do ecrã de login.
