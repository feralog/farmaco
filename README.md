# README - Sistema de Quiz de Farmacologia com Repetição Espaçada

Este é um sistema educacional de farmacologia que implementa um quiz interativo com repetição espaçada similar ao Anki. O sistema foi desenvolvido com base em slides de aulas de farmacologia e permite aos usuários estudar e revisar o conteúdo de forma eficiente.

## Características Principais

- **Login por nome de usuário**: Sistema de login simples para identificação do usuário
- **Múltiplos módulos de estudo**: AINES E AIES, Anestésicos Gerais, Anestésicos Locais e Antipsicóticos Atípicos
- **120 questões de múltipla escolha**: 30 questões por módulo (20 conteudistas + 10 de raciocínio)
- **Sistema de repetição espaçada**: Similar ao Anki, apresenta questões com base no histórico de acertos/erros
- **Classificação de dificuldade**: Permite ao usuário classificar a dificuldade de cada questão (1-5)
- **Armazenamento local**: Salva o progresso automaticamente a cada 10 segundos e ao fechar a página
- **Timer**: Acompanhamento do tempo durante o quiz
- **Feedback visual**: Indicação visual após seleção (verde para correta, vermelho para incorreta)
- **Explicações detalhadas**: Exibição da explicação após cada resposta
- **Interface responsiva**: Design adaptável para diferentes dispositivos
- **Análise de desempenho**: Estatísticas e recomendações após cada sessão de estudo

## Estrutura de Arquivos

```
quiz-farmacologia/
├── index.html              # Página principal do sistema
├── css/
│   └── styles.css          # Estilos CSS do sistema
├── js/
│   ├── app.js              # Lógica principal do aplicativo
│   ├── data.js             # Gerenciamento de dados e carregamento das questões
│   └── spaced-repetition.js # Implementação do algoritmo de repetição espaçada
└── questoes_*.json         # Arquivos JSON com as questões de cada módulo
```

## Como Usar

1. Abra o arquivo `index.html` em um navegador web moderno
2. Faça login com seu nome de usuário
3. Selecione um módulo para estudar ou clique em "Iniciar Revisão Espaçada"
4. Responda às questões e classifique a dificuldade de cada uma
5. Visualize seus resultados ao final de cada sessão
6. Seu progresso é salvo automaticamente

## Publicação no GitHub Pages

Para publicar o sistema no GitHub Pages:

1. Crie um novo repositório no GitHub
2. Faça upload de todos os arquivos do sistema para o repositório
3. Vá para as configurações do repositório
4. Na seção "GitHub Pages", selecione a branch principal como fonte
5. O sistema estará disponível em `https://seu-usuario.github.io/nome-do-repositorio/`

## Tecnologias Utilizadas

- HTML5
- CSS3 (com Bootstrap 5)
- JavaScript (ES6+)
- LocalStorage para armazenamento de dados
- Font Awesome para ícones

## Algoritmo de Repetição Espaçada

O sistema implementa uma adaptação do algoritmo SM-2 (usado pelo Anki) para determinar quando as questões devem ser revisadas. O algoritmo considera:

- Histórico de acertos e erros
- Classificação de dificuldade feita pelo usuário
- Tempo desde a última revisão

## Personalização

Você pode personalizar o sistema editando os seguintes arquivos:

- `css/styles.css` para alterar a aparência
- `js/app.js` para modificar o comportamento do aplicativo
- `js/spaced-repetition.js` para ajustar o algoritmo de repetição espaçada

## Limitações e Considerações

- O sistema utiliza localStorage, que tem limite de armazenamento (geralmente 5-10MB)
- Os dados são armazenados apenas no navegador local do usuário
- Para transferir dados entre dispositivos, seria necessário implementar uma funcionalidade de exportação/importação

## Suporte

Para suporte ou dúvidas sobre o sistema, entre em contato com o desenvolvedor.
