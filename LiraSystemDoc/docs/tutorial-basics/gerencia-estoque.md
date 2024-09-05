---
sidebar_position: 5
---

# Gerenciador de Estoque

A tela **Gerenciador de Estoque** está disponível exclusivamente para usuários com o cargo T.I. ou cargos especiais. Nesta interface, os usuários podem gerenciar os itens disponíveis para a tela de Solicitações.

## Funcionalidades Principais

### 1. Gerenciamento de Itens

Os usuários podem realizar as seguintes ações para cada item no estoque:

- **Separação por Categoria**: Os itens são organizados em categorias, facilitando a visualização e a gestão.
- **Cadastro de Novos Itens**: É possível adicionar novos itens ao estoque, definindo:
  - **Categoria**: Pode-se escolher uma categoria existente ou criar uma nova.
  - **Nome do Item**: Nome do produto a ser adicionado.
  - **Preço do Item**: Valor monetário do item.
  - **Quantidade Real do Estoque**: A quantidade física real disponível.
  - **Quantidade de Controle**: Quantidade utilizada para controle de estoque.
  - **Limite de Quantidade**: Define o limite máximo que pode ser solicitado por usuários.

### 2. Visualização e Ação sobre Itens Cadastrados

Os itens cadastrados podem ser visualizados em uma lista com as seguintes informações:
- **Nome do Item**
- **Quantidade**: Quantidade disponível para controle.
- **Quantidade Real**: Quantidade física do item.
- **Limite de Quantidade**: Limite máximo permitido para solicitação.
- **Preço**: Valor do item.

Para cada item listado, os usuários têm acesso a um botão ![EDX Icon](/img/btacaoestoque.png) que permite as seguintes ações:
- **Entrada**: Adicionar novas unidades ao estoque.
- **Saída**: Remover unidades do estoque.
- **Alteração**: Modificar informações como preço, quantidade real, quantidade de controle, e limite de quantidade.

### 3. Modal de Ações

Ao clicar no botão ![EDX Icon](/img/btacaoestoque.png), o usuário pode:
- **Selecionar a Ação**: Escolher entre entrada, saída, ou alteração.
- **Confirmar a Ação**: Após definir as mudanças, é possível confirmar a entrada, saída ou alteração.

### 4. Exclusão de Itens

Além das ações de entrada e saída, os usuários podem **excluir** itens do estoque. Ao clicar no ícone de exclusão, será solicitado uma confirmação antes de proceder com a remoção do item.

### 5. Modais de Alerta e Confirmação

- **Modal de Exclusão**: Solicita a confirmação antes de excluir um item do estoque.
- **Modal de Erro**: Exibe mensagens de erro, como tentativa de subtração de uma quantidade maior do que a disponível.
- **Modal de Salvamento**: Indica que as alterações estão sendo salvas.

## Resumo

O **Gerenciador de Estoque** fornece uma interface robusta para a administração detalhada do inventário de itens de T.I., garantindo que os responsáveis possam manter o controle preciso dos recursos disponíveis para solicitação.
