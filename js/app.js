/**
 * app.js - Lógica principal do aplicativo de quiz
 * 
 * Este arquivo contém a lógica principal do aplicativo, incluindo:
 * - Gerenciamento de telas e navegação
 * - Lógica do quiz (perguntas, respostas, pontuação)
 * - Timer e progresso
 * - Integração com o sistema de repetição espaçada
 */

// Variáveis globais
let currentUser = '';
let currentModule = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let correctAnswers = 0;
let incorrectAnswers = 0;
let quizStartTime = null;
let quizTimer = null;
let quizSeconds = 0;
let selectedDifficulty = 0;
let isReviewMode = false;
let reviewQuestions = [];

// Elementos DOM
const screens = {
    login: document.getElementById('login-screen'),
    moduleSelection: document.getElementById('module-selection-screen'),
    quiz: document.getElementById('quiz-screen'),
    results: document.getElementById('results-screen')
};

// Inicialização
document.addEventListener('DOMContentLoaded', init);

/**
 * Inicializa o aplicativo
 */
async function init() {
    try {
        // Carrega as questões
        await loadAllQuestions();
        console.log('Questões carregadas com sucesso');
        
        // Tenta carregar dados do usuário
        if (loadUserData()) {
            currentUser = getUsername();
            showModuleSelectionScreen();
        } else {
            showLoginScreen();
        }
        
        // Configura os event listeners
        setupEventListeners();
        
    } catch (error) {
        console.error('Erro ao inicializar o aplicativo:', error);
        alert('Ocorreu um erro ao carregar o aplicativo. Por favor, recarregue a página.');
    }
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    document.getElementById('reset-progress-btn').addEventListener('click', resetAllProgress);
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Module selection
    document.querySelectorAll('.module-btn').forEach(btn => {
        btn.addEventListener('click', () => startQuiz(btn.dataset.module));
    });
    
    document.getElementById('start-review-btn').addEventListener('click', startSpacedRepetition);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Quiz
    document.getElementById('quit-quiz-btn').addEventListener('click', quitQuiz);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    
    // Difficulty buttons
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove a classe 'selected' de todos os botões
            document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('selected'));
            
            // Adiciona a classe 'selected' ao botão clicado
            btn.classList.add('selected');
            
            // Armazena a dificuldade selecionada
            selectedDifficulty = parseInt(btn.dataset.difficulty);
            
            // Habilita o botão de próxima questão
            document.getElementById('next-question-btn').disabled = false;
        });
    });
    
    // Results
    document.getElementById('retry-module-btn').addEventListener('click', () => startQuiz(currentModule));
    document.getElementById('return-to-modules-btn').addEventListener('click', showModuleSelectionScreen);
    
    // Configura o salvamento automático
    window.addEventListener('beforeunload', saveUserData);
}

function resetAllProgress() {
  if (confirm('ATENÇÃO: Isso apagará todo o seu progresso em todos os módulos. Esta ação não pode ser desfeita. Deseja continuar?')) {
    try {
      // Remove todos os dados do localStorage
      clearUserData();
      
      // Feedback visual
      alert('Progresso resetado com sucesso! O aplicativo será recarregado.');
      
      // Recarrega a página para aplicar as mudanças
      window.location.reload();
    } catch (error) {
      console.error("Erro ao resetar progresso:", error);
      alert('Ocorreu um erro ao tentar resetar o progresso. Por favor, tente novamente.');
    }
  }
}
/**
 * Manipula o envio do formulário de login
 * @param {Event} event - Evento de submit
 */
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    
    if (username) {
        currentUser = username;
        setUsername(username);
        showModuleSelectionScreen();
    }
}

/**
 * Manipula o logout do usuário
 */
function handleLogout() {
    if (confirm('Tem certeza que deseja sair? Seu progresso está salvo.')) {
        currentUser = '';
        showLoginScreen();
    }
}

/**
 * Mostra a tela de login
 */
function showLoginScreen() {
    hideAllScreens();
    screens.login.classList.remove('d-none');
    document.getElementById('username').value = currentUser;
}

/**
 * Mostra a tela de seleção de módulos
 */
function showModuleSelectionScreen() {
    hideAllScreens();
    screens.moduleSelection.classList.remove('d-none');
    
    // Atualiza o nome do usuário
    document.getElementById('user-display').textContent = currentUser;
    
    // Atualiza o progresso dos módulos
    updateModuleProgress();
}

/**
 * Atualiza o progresso exibido para cada módulo
 */
function updateModuleProgress() {
    // Atualiza o progresso de cada módulo
    document.querySelectorAll('.module-progress').forEach(element => {
        const module = element.dataset.module;
        const progress = calculateModuleProgress(module);
        element.textContent = `${progress}%`;
        
        // Atualiza a cor baseada no progresso
        if (progress >= 80) {
            element.classList.remove('bg-primary', 'bg-warning');
            element.classList.add('bg-success');
        } else if (progress >= 40) {
            element.classList.remove('bg-primary', 'bg-success');
            element.classList.add('bg-warning');
        } else {
            element.classList.remove('bg-warning', 'bg-success');
            element.classList.add('bg-primary');
        }
    });
    
    // Atualiza o progresso geral
    const overallProgress = calculateOverallProgress();
    document.getElementById('overall-progress').textContent = `${overallProgress}%`;
    document.getElementById('overall-progress-bar').style.width = `${overallProgress}%`;
    
    // Atualiza a cor do progresso geral
    const progressBar = document.getElementById('overall-progress-bar');
    if (overallProgress >= 80) {
        progressBar.className = 'progress-bar bg-success';
    } else if (overallProgress >= 40) {
        progressBar.className = 'progress-bar bg-warning';
    } else {
        progressBar.className = 'progress-bar bg-primary';
    }
}

/**
 * Inicia o quiz para um módulo específico
 * @param {string} module - Nome do módulo
 */
function startQuiz(module) {
    currentModule = module;
    isReviewMode = false;


        // Adicione este bloco especial para Opioides
        if (module === 'Opioides') {
                    console.log("Carregando questões de Opioides diretamente");
                    // Defina as questões diretamente
                    currentQuestions = [[
  {
    "question": "Qual é a principal fonte do ópio, de onde se extrai a morfina?",
    "options": [
      "Folha de coca",
      "Papoula",
      "Cannabis",
      "Beladona",
      "Efedra"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, a papoula é a principal fonte do ópio, e desta se extrai a morfina como alcaloide puro. Isso é mencionado no slide 'Papoula é a principal fonte do ópio e desta se extrai a morfina alcaloide puro'. As outras opções são plantas que contêm outros tipos de substâncias psicoativas, mas não são fontes de ópio ou morfina.",
    "type": "conteudista"
  },
  {
    "question": "Como são classificados os analgésicos opioides quanto à sua origem?",
    "options": [
      "Apenas naturais e sintéticos",
      "Apenas semissintéticos e sintéticos",
      "Naturais, semissintéticos e substitutos sintéticos",
      "Apenas naturais e semissintéticos",
      "Apenas sintéticos e biossintéticos"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, os analgésicos opioides são classificados quanto à origem como naturais, semissintéticos e os chamados substitutos sintéticos. Isso é mencionado no slide 'Classificação quanto à origem: Analgésicos opioides incluem os naturais, semissintéticos e os chamados de substitutos sintéticos'. As outras opções estão incompletas ou incorretas, pois não abrangem todas as categorias mencionadas no material.",
    "type": "conteudista"
  },
  {
    "question": "Qual é a função dos agentes opioides antagonistas na clínica médica?",
    "options": [
      "Promover analgesia potente",
      "Induzir o sono em pacientes com insônia",
      "Reverter quadros de intoxicação por analgésicos opioides",
      "Tratar a dependência química de forma preventiva",
      "Potencializar o efeito dos analgésicos não opioides"
    ],
    "correctIndex": 2,
    "explanation": "De acordo com o material, os agentes opioides antagonistas 'são utilizados na clínica médica para reverter um quadro de intoxicação por analgésicos opioide, que são promotores de dependência'. A naloxona é citada como exemplo de antagonista. As outras opções estão incorretas porque os antagonistas não promovem analgesia (opção A), não são usados como indutores do sono (opção B), não têm função preventiva na dependência (opção D) e não potencializam analgésicos não opioides (opção E).",
    "type": "conteudista"
  },
  {
    "question": "Qual alcaloide é encontrado em maior quantidade no ópio?",
    "options": [
      "Codeína",
      "Heroína",
      "Morfina (10%)",
      "Papaverina",
      "Tebaína"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, 'O ópio possui inúmeros alcaloides dos quais se extrai a morfina (10%), a codeína e a heroína'. Isso indica que a morfina está presente em 10% do ópio, sendo o alcaloide encontrado em maior quantidade. As outras opções mencionam alcaloides que também estão presentes no ópio, mas em quantidades menores ou, no caso da heroína, é um derivado semissintético, não um alcaloide natural do ópio.",
    "type": "conteudista"
  },
  {
    "question": "Qual termo é utilizado para descrever os alcaloides naturais como a morfina, codeína, tebaína e papaverina?",
    "options": [
      "Opioide",
      "Opiáceo",
      "Narcótico",
      "Analgésico central",
      "Agonista opioide"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, o termo 'Opiáceo' é usado para descrever os alcaloides naturais como a morfina, codeína, tebaína e papaverina. Já o termo 'Opioide' refere-se a todos os compostos que atuam em receptores opioides, incluindo naturais, semissintéticos e sintéticos. 'Narcótico' é um termo jurídico para drogas de abuso, não sendo mais usado farmacologicamente. 'Analgésico central' e 'Agonista opioide' são termos relacionados à função ou mecanismo de ação, não à origem natural dos compostos.",
    "type": "conteudista"
  },
  {
    "question": "Qual receptor opioide é considerado o principal receptor analgésico, sobre o qual a morfina exibe maior afinidade?",
    "options": [
      "Receptor kappa (κ)",
      "Receptor delta (δ)",
      "Receptor sigma (σ)",
      "Receptor mu (μ)",
      "Receptor epsilon (ε)"
    ],
    "correctIndex": 3,
    "explanation": "Segundo o material, a morfina é um 'Agonista integral do receptor (μ/mu)' e 'Tal receptor é o principal receptor analgésico'. Também é mencionado que 'A morfina exibe maior afinidade sobre o μ do que a codeína'. As outras opções mencionam receptores opioides que existem (kappa e delta) ou que já foram propostos (sigma e epsilon), mas não são identificados no material como o principal receptor analgésico ou aquele com maior afinidade pela morfina.",
    "type": "conteudista"
  },
  {
    "question": "O que são os Peptídeos Opioides Endógenos (POE)?",
    "options": [
      "Fármacos sintéticos que imitam a ação da morfina",
      "Peptídeos produzidos pelo organismo com ação semelhante aos opioides farmacológicos",
      "Metabólitos da morfina após biotransformação hepática",
      "Antagonistas naturais dos receptores opioides",
      "Substâncias liberadas durante a inflamação que sensibilizam nociceptores"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, os Peptídeos Opioides Endógenos (POE) são 'peptídeos endógenos com ação semelhante' aos opioides farmacológicos, que 'produzem analgesia sobre os receptores do SNC'. O material também menciona que eles fazem parte da 'Via moduladora da dor' e que 'estímulos de dor, exercícios, podem induzir a liberação dos POE'. As outras opções estão incorretas porque os POE não são fármacos sintéticos, metabólitos da morfina, antagonistas ou substâncias inflamatórias.",
    "type": "conteudista"
  },
  {
    "question": "Qual é o efeito da ativação dos receptores opioides μ na medula espinal?",
    "options": [
      "Aumento do influxo de Ca²+ nas terminações pré-sinápticas",
      "Diminuição da condutância do K+ pós-sináptico",
      "Inibição da transmissão central de estímulos nociceptivos",
      "Aumento da resposta pós-sináptica à neurotransmissão excitatória",
      "Potencialização da liberação de neurotransmissores excitatórios"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, 'A ativação dos receptores opioides μ tanto pré-sinápticos quanto pós-sinápticos por neurônios inibitórios descendentes e de circuito local inibe a transmissão central de estímulos nociceptivos'. O material também explica que 'Na terminação pré-sináptica, a ativação do receptor opioide μ diminui o influxo de Ca²+ em resposta a um potencial de ação' e 'A ativação dos receptores opioides μ pós-sinápticos aumenta a condutância do K+ e diminui, portanto, a resposta pós-sináptica à neurotransmissão excitatória'. As outras opções contradizem diretamente estas informações.",
    "type": "conteudista"
  },
  {
    "question": "Por que pode ser necessário aumentar a dose de morfina quando administrada por via oral?",
    "options": [
      "Devido à baixa solubilidade da morfina no trato gastrointestinal",
      "Devido ao efeito de primeira passagem hepática",
      "Devido à rápida excreção renal da morfina",
      "Devido à baixa afinidade da morfina pelos receptores μ",
      "Devido à degradação da morfina pelo ácido gástrico"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, 'Devido ao efeito de primeira passagem, pode ser necessário aumentar a dose por exemplo da morfina. E desta forma pode-se atingir o índice terapêutico observado em outras vias'. O material também menciona que 'Há grandes variações entre os pacientes em relação à primeira passagem o que torna a previsão da dose oral questionável'. As outras opções não são mencionadas como razões para aumentar a dose oral de morfina no material fornecido.",
    "type": "conteudista"
  },
  {
    "question": "Quais são os locais de depósito dos opioides que ajudam a manter uma dose sustentada, especialmente em grandes doses?",
    "options": [
      "Fígado e rins",
      "Cérebro e pulmões",
      "Músculo estriado esquelético e tecido adiposo",
      "Baço e medula óssea",
      "Coração e vasos sanguíneos"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, 'O músculo estriado esquelético e o tecido adiposo são locais de depósito para manter uma dose sustentada, em especial nas grandes doses'. Isso é mencionado na seção sobre distribuição dos opioides. As outras opções mencionam órgãos que, embora possam receber o fármaco durante a distribuição (como fígado, rins, cérebro e pulmões, que são mencionados como 'tecidos com rica perfusão'), não são especificamente citados como locais de depósito para manutenção de dose sustentada.",
    "type": "conteudista"
  },
  {
    "question": "Como ocorre a biotransformação da morfina no organismo?",
    "options": [
      "É convertida em heroína por esterases",
      "É conjugada ao ácido glicurônico, formando metabólitos 3 e 6",
      "É metabolizada em codeína no fígado",
      "É convertida em peptídeos opioides endógenos",
      "É desacetilada por enzimas plasmáticas"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, a morfina é 'convertida em metabólitos polares', 'conjugada ao ácido glicurônico' e 'excretada principalmente pelos rins'. Especificamente, 'A morfina é conjugada' em posições '3 (neuroexcitatória)' e '6 Maior potência analgésica'. As outras opções estão incorretas: a morfina não é convertida em heroína (é o contrário), não é metabolizada em codeína, não se converte em peptídeos endógenos e não sofre desacetilação como principal via metabólica.",
    "type": "conteudista"
  },
  {
    "question": "Qual é a principal via de excreção dos opioides após sua biotransformação?",
    "options": [
      "Pulmonar, através da expiração",
      "Hepática, através da bile",
      "Renal, após polarização e conjugação",
      "Intestinal, através das fezes",
      "Cutânea, através do suor"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, a excreção dos opioides é 'Renal após polarização e conjugação'. O material também menciona que 'Pequena quantidade é liberada pela bile', mas a via principal é a renal. Também há um alerta sobre pacientes com doença renal: 'Deve-se chamar atenção para os pacientes com doença renal, que torna a excreção mais difícil, produzindo sedação e depois depressão respiratória'. As outras opções não são mencionadas como vias significativas de excreção dos opioides.",
    "type": "conteudista"
  },
  {
    "question": "Qual é o mecanismo celular pelo qual os receptores opioides exercem seus efeitos?",
    "options": [
      "São canais iônicos que permitem a entrada de cálcio na célula",
      "São receptores acoplados à proteína G",
      "São enzimas que degradam neurotransmissores excitatórios",
      "São transportadores de membrana para neurotransmissores inibitórios",
      "São receptores nucleares que alteram a expressão gênica"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, na seção sobre farmacodinâmica, 'Os receptores opioides são acoplados a proteína G'. Este é o mecanismo celular básico pelo qual os opioides exercem seus efeitos, incluindo analgesia. As outras opções descrevem outros tipos de receptores ou mecanismos celulares que não correspondem aos receptores opioides conforme descrito no material.",
    "type": "conteudista"
  },
  {
    "question": "Qual opioide é descrito como tendo ação rápida, curta duração e potência 100 vezes maior que a da morfina?",
    "options": [
      "Codeína",
      "Tramadol",
      "Metadona",
      "Fentanil",
      "Oxicodona"
    ],
    "correctIndex": 3,
    "explanation": "Segundo o material, 'Fentanil® é um analgésico opioide que se caracteriza pelas seguintes propriedades: Rápida ação, curta duração e elevada potência (100 vezes maior do que a da morfina)'. O material também menciona que 'A duração de ação comum do efeito analgésico é de aproximadamente 30 minutos após dose única intravenosa (IV) de até 100 mcg'. As outras opções mencionam opioides com características diferentes: a codeína é um opioide fraco, o tramadol é análogo da codeína, a metadona tem longa duração de ação e a oxicodona tem 1,8 vezes a potência da morfina.",
    "type": "conteudista"
  },
  {
    "question": "Qual das seguintes alternativas NÃO é um efeito adverso dos opioides mencionado no material?",
    "options": [
      "Náuseas e vômitos",
      "Obstipação (constipação)",
      "Hipertensão arterial",
      "Broncoespasmo",
      "Prurido"
    ],
    "correctIndex": 2,
    "explanation": "Analisando a lista de efeitos adversos mencionada no material, a hipertensão arterial não é citada. Pelo contrário, o material menciona 'Hipotensão' como um dos efeitos adversos. Os outros efeitos listados nas alternativas são todos mencionados explicitamente na lista de efeitos adversos: 'Náuseas e vômitos', 'Obstipação', 'Broncoespasmo' e 'Prurido'.",
    "type": "conteudista"
  },
  {
    "question": "Qual característica da codeína é corretamente descrita no material?",
    "options": [
      "É um opioide forte indicado para dores intensas",
      "Tem biodisponibilidade oral muito baixa",
      "É transformada em morfina no fígado",
      "Tem tempo de analgesia de 8-12 horas",
      "É excretada principalmente pela bile"
    ],
    "correctIndex": 2,
    "explanation": "De acordo com o material, a codeína é 'Transformação hepática em morfina'. Isso significa que a codeína é um pró-fármaco que precisa ser metabolizada no fígado para se transformar em morfina, seu metabólito ativo. As outras opções contêm informações incorretas: a codeína é descrita como 'Opioide fraco (dores nociceptivas - segundo degrau)', não como opioide forte; sua excreção é descrita como 'renal', não biliar; e seu tempo de analgesia é de '4-5 h', não 8-12 horas. A biodisponibilidade oral não é especificamente mencionada para a codeína, mas o material indica que 'Codeína e Oxicodona são efetivos por via oral'.",
    "type": "conteudista"
  },
  {
    "question": "Qual é a dose máxima diária de Tramadol mencionada no material?",
    "options": [
      "200 mg/dia",
      "300 mg/dia",
      "400 mg/dia",
      "500 mg/dia",
      "600 mg/dia"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, o Tramadol tem 'Dose máxima de 400 mg/dia'. Esta informação é apresentada no início da descrição do Tramadol. As outras opções apresentam valores que não correspondem à dose máxima mencionada no material.",
    "type": "conteudista"
  },
  {
    "question": "Qual característica da metadona é corretamente descrita no material?",
    "options": [
      "Tem vida média plasmática curta (2-4 horas)",
      "É contraindicada em pacientes com insuficiência renal",
      "Leva 3 a 7 dias para impregnar",
      "É um opioide fraco indicado para dores leves a moderadas",
      "Tem metabolização principalmente renal"
    ],
    "correctIndex": 2,
    "explanation": "De acordo com o material, a metadona '3 a 7 dias para impregnar- dose controlada pelo indivíduo'. Esta é uma característica importante da metadona, que tem acúmulo gradual no organismo. As outras opções contêm informações incorretas: a metadona tem 'Vida média plasmática: 8 - 75 h', não 2-4 horas; é descrita como 'Opioide sintético FORTE', não como opioide fraco; tem 'Metabolização hepática', não renal; e 'Pode usar em I Renal' (pode ser usada em insuficiência renal), não sendo contraindicada.",
    "type": "conteudista"
  },
  {
    "question": "Qual característica da oxicodona é corretamente descrita no material?",
    "options": [
      "Tem potência equivalente a 50% da morfina",
      "Tem efeito de duração de 24 horas",
      "Tem potência 1,8 vezes maior que a morfina",
      "É contraindicada para uso oral",
      "Tem baixo potencial para abuso"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, a oxicodona tem '1,8 a potência da morfina', ou seja, é 1,8 vezes mais potente que a morfina. As outras opções contêm informações incorretas: o material menciona que a oxicodona tem 'Efeito 12 h', não 24 horas; tem 'maior potencial para abuso, semelhante à heroína', não baixo potencial; tem 'Boa biodisponibilidade via oral', não sendo contraindicada para uso oral; e sua potência é maior que a da morfina, não 50% dela.",
    "type": "conteudista"
  },
  {
    "question": "Qual característica da buprenorfina é corretamente descrita no material?",
    "options": [
      "Tem vida média curta de 2 horas",
      "É uma molécula apenas agonista",
      "Tem ligação fraca e transitória com o receptor",
      "Tem absorção lenta e baixa biodisponibilidade",
      "Tem ligação intensa e duradoura com o receptor"
    ],
    "correctIndex": 4,
    "explanation": "De acordo com o material, a buprenorfina tem 'Ligação intensa e duradoura com o receptor'. As outras opções contêm informações incorretas: o material menciona que a buprenorfina tem 'Vida média de 8h', não 2 horas; é uma 'Molécula agonista e antagonista', não apenas agonista; tem 'Absorção rápida e excelente biodisponibilidade', não absorção lenta e baixa biodisponibilidade.",
    "type": "conteudista"
  },
  {
    "question": "Qual efeito adverso dos opioides NÃO desenvolve tolerância com o uso contínuo, segundo o material?",
    "options": [
      "Náuseas",
      "Vômitos",
      "Sedação",
      "Sonolência",
      "Constipação"
    ],
    "correctIndex": 4,
    "explanation": "Segundo o material, na seção sobre morfina, são mencionados os efeitos adversos: 'Náuseas, vômitos, sedação, sonolência (passam a ser tolerados após alguns dias)' e 'Constipação- não tem tolerância'. Isso indica que a constipação é o único efeito adverso listado que não desenvolve tolerância com o uso contínuo, permanecendo um problema durante todo o tratamento com opioides.",
    "type": "conteudista"
  },
  {
    "question": "Qual é a principal diferença entre a remifentanila e outros opioides?",
    "options": [
      "É o único opioide que pode ser usado em pacientes com insuficiência renal",
      "É indicada para analgesia durante procedimentos cirúrgicos e no período pós-operatório imediato",
      "Tem duração de ação muito longa, de até 24 horas",
      "É o único opioide que não causa depressão respiratória",
      "É administrada apenas por via oral"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, a remifentanila 'é indicado como agente analgésico na indução e/ou manutenção da anestesia geral durante procedimentos cirúrgicos, entre eles a cirurgia cardíaca. É indicado também na continuação da analgesia durante o período pós-operatório imediato, sob estrito controle, e durante a transição para a analgesia de longa duração'. Também é mencionado que é 'igualmente indicado para promover analgesia e sedação em pacientes ventilados mecanicamente em unidade de terapia intensiva'. As outras opções contêm informações que não são especificamente mencionadas para a remifentanila no material.",
    "type": "conteudista"
  },
  {
    "question": "Qual dos seguintes opioides é descrito como tendo ação sinérgica com paracetamol e dipirona?",
    "options": [
      "Morfina",
      "Codeína",
      "Tramadol",
      "Metadona",
      "Fentanil"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, o Tramadol 'Tem ação sinérgica com paracetamol e dipirona'. Esta informação é apresentada na descrição do Tramadol. As outras opções mencionam opioides para os quais não é descrita essa ação sinérgica específica com paracetamol e dipirona no material fornecido.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente com insuficiência renal crônica necessita de analgesia com opioides. Com base no material, qual seria a melhor opção?",
    "options": [
      "Morfina, pois tem excreção principalmente biliar",
      "Metadona, pois pode ser usada em insuficiência renal",
      "Fentanil, pois tem curta duração de ação",
      "Tramadol, pois tem excreção pulmonar",
      "Codeína, pois não é metabolizada no fígado"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, a metadona 'Pode usar em I Renal', ou seja, pode ser usada em pacientes com insuficiência renal. As outras opções contêm informações incorretas ou não mencionadas no material: a morfina tem excreção principalmente renal, não biliar, e o material alerta que 'Deve-se chamar atenção para os pacientes com doença renal, que torna a excreção mais difícil, produzindo sedação e depois depressão respiratória'; o fentanil tem curta duração, mas não há menção específica sobre seu uso em insuficiência renal; o tramadol tem 'Excreção renal', não pulmonar; e a codeína é 'Transformação hepática em morfina' e tem 'Excreção renal', não sendo ideal para pacientes com insuficiência renal.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente está usando morfina há duas semanas e se queixa de constipação severa. Com base no material, qual seria a melhor conduta?",
    "options": [
      "Suspender a morfina, pois este efeito adverso indica toxicidade",
      "Reduzir a dose da morfina, pois este efeito tende a diminuir com doses menores",
      "Trocar a morfina por outro opioide que não cause constipação",
      "Manter a morfina e tratar a constipação, pois este efeito não desenvolve tolerância",
      "Aumentar a dose da morfina para desenvolver tolerância a este efeito"
    ],
    "correctIndex": 3,
    "explanation": "Segundo o material, a constipação é um efeito adverso da morfina que 'não tem tolerância', ou seja, não diminui com o uso contínuo. Portanto, a melhor conduta seria manter a morfina (se necessária para o controle da dor) e tratar a constipação com medidas apropriadas. As outras opções não são adequadas: suspender a morfina não é necessário, pois a constipação é um efeito adverso esperado, não um sinal de toxicidade; reduzir a dose pode comprometer o controle da dor e não resolverá necessariamente a constipação; trocar por outro opioide não resolverá o problema, pois todos os opioides causam constipação; e aumentar a dose não desenvolverá tolerância a este efeito específico, podendo até piorá-lo.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente apresenta depressão respiratória grave após receber uma dose de morfina. Qual fármaco seria mais indicado para reverter este quadro?",
    "options": [
      "Tramadol",
      "Naloxona",
      "Metadona",
      "Fentanil",
      "Codeína"
    ],
    "correctIndex": 1,
    "explanation": "De acordo com o material, os agentes opioides antagonistas, como a naloxona, 'são utilizados na clínica médica para reverter um quadro de intoxicação por analgésicos opioide'. A depressão respiratória é um efeito adverso grave dos opioides que pode ocorrer em casos de intoxicação ou doses excessivas. As outras opções mencionam opioides agonistas que não reverteriam, mas sim potencializariam a depressão respiratória: o tramadol é um 'Análogo da codeína', a metadona é um 'Opioide sintético FORTE', o fentanil tem 'elevada potência (100 vezes maior do que a da morfina)' e a codeína é 'Transformação hepática em morfina'.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente com dor crônica intensa está usando oxicodona há 3 meses. Qual característica deste medicamento deve ser considerada no acompanhamento deste paciente?",
    "options": [
      "Baixo potencial para desenvolvimento de dependência",
      "Ausência de efeitos adversos gastrointestinais",
      "Maior potencial para abuso, semelhante à heroína",
      "Curta duração de ação, necessitando doses a cada 2 horas",
      "Baixa biodisponibilidade oral, necessitando administração parenteral"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, a oxicodona tem 'maior potencial para abuso, semelhante à heroína e afeta o sistema nervoso da mesma forma'. Esta é uma característica importante a ser considerada no acompanhamento de um paciente em uso prolongado deste medicamento, pois implica risco de dependência e abuso. As outras opções contêm informações incorretas: não há menção de baixo potencial para dependência (pelo contrário); não há menção de ausência de efeitos gastrointestinais (os opioides em geral causam constipação); a oxicodona tem 'Efeito 12 h', não curta duração; e tem 'Boa biodisponibilidade via oral', não baixa.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente com doença renal crônica está usando morfina e apresenta sinais de neurotoxicidade. Qual mecanismo poderia explicar este quadro?",
    "options": [
      "Acúmulo do metabólito morfina-3-glicuronídeo, que tem propriedades neuroexcitatórias",
      "Interação da morfina com receptores NMDA no sistema nervoso central",
      "Liberação excessiva de peptídeos opioides endógenos",
      "Bloqueio dos receptores kappa, causando efeitos paradoxais",
      "Conversão acelerada da morfina em heroína no ambiente urêmico"
    ],
    "correctIndex": 0,
    "explanation": "De acordo com o material, a morfina é conjugada em posições '3 (neuroexcitatória)' e '6 Maior potência analgésica'. Além disso, o material menciona que 'A polarização torna dificuldades em ultrapassar a BHE. Só em doses sucessivas. O excesso como nos portadores de doença renal crônica pode contribuir para excitar o SNC'. Isso sugere que o acúmulo do metabólito morfina-3-glicuronídeo, que tem propriedades neuroexcitatórias, pode ocorrer em pacientes com doença renal crônica devido à excreção reduzida, levando a sinais de neurotoxicidade. As outras opções mencionam mecanismos que não são descritos no material em relação à neurotoxicidade da morfina em pacientes com doença renal.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente necessita de analgesia para um procedimento cirúrgico cardíaco. Com base no material, qual opioide seria mais indicado?",
    "options": [
      "Codeína, por sua longa duração de ação",
      "Tramadol, por sua potência elevada",
      "Metadona, por sua rápida eliminação",
      "Remifentanila, indicada para anestesia geral durante procedimentos cirúrgicos",
      "Buprenorfina, por sua ação exclusivamente agonista"
    ],
    "correctIndex": 3,
    "explanation": "Segundo o material, a remifentanila 'é indicado como agente analgésico na indução e/ou manutenção da anestesia geral durante procedimentos cirúrgicos, entre eles a cirurgia cardíaca'. Esta indicação específica para cirurgia cardíaca torna a remifentanila a opção mais adequada para o caso descrito. As outras opções contêm informações incorretas ou inadequadas para o contexto: a codeína é um 'Opioide fraco' com tempo de analgesia de '4-5 h', não tendo longa duração; o tramadol é um 'Análogo da codeína', não tendo potência elevada; a metadona '3 a 7 dias para impregnar', não tendo rápida eliminação; e a buprenorfina é uma 'Molécula agonista e antagonista', não exclusivamente agonista.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente está usando fentanil para controle da dor. Qual característica deste medicamento é importante considerar no manejo deste paciente?",
    "options": [
      "Longa duração de ação, permitindo administração uma vez ao dia",
      "Baixa potência, necessitando doses elevadas para efeito analgésico",
      "Rápida ação, curta duração e elevada potência (100 vezes maior que a morfina)",
      "Ausência de efeito depressor respiratório",
      "Metabolização exclusivamente renal, sem passagem hepática"
    ],
    "correctIndex": 2,
    "explanation": "De acordo com o material, o fentanil tem 'Rápida ação, curta duração e elevada potência (100 vezes maior do que a da morfina)'. Também é mencionado que 'A duração de ação comum do efeito analgésico é de aproximadamente 30 minutos após dose única intravenosa (IV) de até 100 mcg'. Estas características são importantes para o manejo adequado do paciente, pois implicam necessidade de monitoramento cuidadoso devido à alta potência e possível necessidade de readministração devido à curta duração. As outras opções contêm informações incorretas que contradizem as características descritas do fentanil no material.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente com dor crônica está usando metadona. Qual característica deste medicamento deve ser considerada no início do tratamento?",
    "options": [
      "Efeito analgésico imediato, com pico de ação em 1 hora",
      "Leva 3 a 7 dias para impregnar, com dose controlada pelo indivíduo",
      "Curta meia-vida, necessitando administração a cada 4 horas",
      "Ausência de efeitos adversos respiratórios",
      "Contraindicação absoluta em pacientes com insuficiência renal"
    ],
    "correctIndex": 1,
    "explanation": "Segundo o material, a metadona '3 a 7 dias para impregnar- dose controlada pelo indivíduo'. Esta característica é fundamental para o manejo adequado no início do tratamento, pois implica que o efeito pleno não será imediato e que a dose precisa ser ajustada gradualmente. As outras opções contêm informações incorretas: a metadona não tem efeito analgésico imediato, justamente por levar dias para impregnar; tem 'Vida média plasmática: 8 - 75 h' e 'Analgesia: 4 - 24 h', não sendo de curta meia-vida; não há menção de ausência de efeitos respiratórios (os opioides em geral podem causar depressão respiratória); e 'Pode usar em I Renal', não sendo contraindicada em insuficiência renal.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente com dor neuropática não está respondendo adequadamente aos analgésicos convencionais. Com base no material, qual opioide poderia ser considerado para este tipo específico de dor?",
    "options": [
      "Codeína",
      "Tramadol",
      "Metadona",
      "Fentanil",
      "Remifentanila"
    ],
    "correctIndex": 2,
    "explanation": "De acordo com o material, a metadona é indicada para 'Dor neuropática'. Esta informação específica é mencionada na descrição da metadona. As outras opções mencionam opioides para os quais não há indicação específica para dor neuropática no material: a codeína é indicada para 'dores nociceptivas - segundo degrau', o tramadol para 'Dor nociceptiva e neuropática (segundo degrau)', mas sendo um opioide fraco pode não ser adequado para casos refratários, o fentanil e a remifentanila não têm indicação específica para dor neuropática mencionada no material.",
    "type": "raciocinio"
  },
  {
    "question": "Um paciente está usando buprenorfina e não está obtendo o alívio esperado da dor após a adição de outro opioide. Qual característica da buprenorfina poderia explicar esta situação?",
    "options": [
      "Baixa biodisponibilidade oral",
      "Curta duração de ação",
      "É uma molécula agonista e antagonista",
      "Metabolização acelerada",
      "Excreção predominantemente biliar"
    ],
    "correctIndex": 2,
    "explanation": "Segundo o material, a buprenorfina é uma 'Molécula agonista e antagonista'. Esta característica dual pode explicar por que a adição de outro opioide não está proporcionando o alívio esperado, pois a buprenorfina, além de ativar parcialmente os receptores opioides (ação agonista), também pode bloquear a ação de outros opioides nos mesmos receptores (ação antagonista). As outras opções não explicariam adequadamente a situação descrita: o material menciona que a buprenorfina tem 'excelente biodisponibilidade', não baixa; tem 'Vida média de 8h', não sendo particularmente curta; não há menção de metabolização acelerada ou excreção predominantemente biliar no material.",
    "type": "raciocinio"
  }
]
                                    // Cole aqui o conteúdo do arquivo JSON (todo o array de questões)
                                ];
        } else {
                    // Obtém as questões do módulo normalmente para os outros módulos
                    currentQuestions = getModuleQuestions(module);
        }

        console.log(`Módulo ${module}: ${currentQuestions.length} questões carregadas`);

        // Se não houver questões, mostre um alerta e retorne
        if (currentQuestions.length === 0) {
                    alert(`Erro: Não foi possível carregar questões para o módulo ${module}`);
                    return;
        }

        // Resto da função...

    
    // Obtém as questões do módulo
    currentQuestions = getModuleQuestions(module);
    
    // Embaralha as questões
  //  shuffleArray(currentQuestions);
    
    // Reinicia as variáveis do quiz
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    quizSeconds = 0;
    
    // Tenta recuperar o progresso salvo
    try {
        const savedProgress = localStorage.getItem(`quizProgress_${module}`);
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            
            // Pergunta ao usuário se deseja continuar de onde parou
            if (confirm(`Você tem um progresso salvo neste módulo. Deseja continuar de onde parou (questão ${progress.index + 1})?`)) {
                currentQuestionIndex = Math.min(progress.index, currentQuestions.length - 1);
                correctAnswers = progress.correct || 0;
                incorrectAnswers = progress.incorrect || 0;
                quizSeconds = progress.time || 0;
                
                console.log(`Progresso recuperado para ${module}:`, progress);
            } else {
            // Se o usuário não quiser continuar, remove o progresso salvo
            localStorage.removeItem(`quizProgress_${module}`);
    
            // Limpa também o progresso das questões individuais para este módulo
            Object.keys(userData.progress[module]).forEach(questionId => {
            userData.progress[module][questionId] = {
            seen: 0,
            correct: 0,
            incorrect: 0,
            lastSeen: null,
            nextReview: null,
            difficulty: 3,
            easeFactor: 2.5,
            interval: 1
                };
            });
    
                // Salva as alterações
            saveUserData();
    
            // Informa ao usuário
            alert("Progresso resetado. A página será recarregada para aplicar as mudanças.");
            
    // Recarrega a página para garantir que tudo seja atualizado
            window.location.reload();
            return; // Importante para interromper a execução da função
        }
        }
    } catch (error) {
        console.error("Erro ao recuperar progresso:", error);
    }
    
    // Mostra a tela do quiz
    showQuizScreen();
    
    // Inicia o timer
    startTimer();
    
    // Carrega a primeira questão
    loadQuestion();
}

/**
 * Inicia o modo de repetição espaçada
 */
function startSpacedRepetition() {
    isReviewMode = true;
    
    // Obtém as questões para revisão
    reviewQuestions = getQuestionsForReview(20);
    
    if (reviewQuestions.length === 0) {
        alert('Não há questões para revisar no momento. Tente novamente mais tarde ou estude um novo módulo.');
        return;
    }
    
    // Reinicia as variáveis do quiz
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    
    // Mostra a tela do quiz
    showQuizScreen();
    
    // Inicia o timer
    startTimer();
    
    // Carrega a primeira questão
    loadReviewQuestion();
}

/**
 * Mostra a tela do quiz
 */
function showQuizScreen() {
    hideAllScreens();
    screens.quiz.classList.remove('d-none');
    
    // Define o título do quiz
    let title;
    if (isReviewMode) {
        title = 'Revisão Espaçada';
    } else {
        title = {
            'AINES_E_AIES': 'AINES E AIES',
            'Anestesicos_Gerais': 'Anestésicos Gerais',
            'Anestesicos_Locais': 'Anestésicos Locais',
            'ATIPICOS': 'Antipsicóticos Atípicos',
            'Opioides': 'Opioides'
        }[currentModule] || currentModule;
    }
    
    document.getElementById('quiz-title').textContent = title;
    
    // Reinicia o contador de respostas
    document.getElementById('correct-count').textContent = `Corretas: 0`;
    document.getElementById('incorrect-count').textContent = `Incorretas: 0`;
}

/**
 * Carrega uma questão no modo normal
 */
function loadQuestion() {
    if (currentQuestionIndex >= currentQuestions.length) {
        showResultsScreen();
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    displayQuestion(question);
    
    // Atualiza o número da questão
    document.getElementById('question-number').textContent = `Questão ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    
    // Atualiza o tipo da questão
    document.getElementById('question-type').textContent = question.type === 'conteudista' ? 'Conteudista' : 'Raciocínio';
    
    // Atualiza a barra de progresso
    const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
}

/**
 * Carrega uma questão no modo de revisão
 */
function loadReviewQuestion() {
    if (currentQuestionIndex >= reviewQuestions.length) {
        showResultsScreen();
        return;
    }
    
    const reviewItem = reviewQuestions[currentQuestionIndex];
    const module = reviewItem.module;
    const questionIndex = reviewItem.index;
    
    // Obtém a questão do módulo correspondente
    const question = getModuleQuestions(module)[questionIndex];
    
    // Armazena o módulo atual temporariamente para esta questão
    currentModule = module;
    
    displayQuestion(question);
    
    // Atualiza o número da questão
    document.getElementById('question-number').textContent = `Questão ${currentQuestionIndex + 1}/${reviewQuestions.length}`;
    
    // Atualiza o tipo da questão
    document.getElementById('question-type').textContent = question.type === 'conteudista' ? 'Conteudista' : 'Raciocínio';
    
    // Atualiza a barra de progresso
    const progress = ((currentQuestionIndex + 1) / reviewQuestions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;
}

/**
 * Exibe uma questão na tela
 * @param {Object} question - Objeto da questão
 */
function displayQuestion(question) {
    // Exibe o texto da questão
    document.getElementById('question-text').textContent = question.question;
    
    // Limpa o container de opções
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Adiciona as opções
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-secondary w-100 option-btn';
        button.dataset.option = index;
        button.dataset.index = index;
        button.textContent = option;
        
        button.addEventListener('click', () => handleAnswer(index));
        
        optionsContainer.appendChild(button);
    });
    
    // Esconde o container de explicação
    document.getElementById('explanation-container').classList.add('d-none');
    
    // Mostra o container de questão
    document.getElementById('question-container').classList.remove('d-none');
    
    // Reseta a dificuldade selecionada
    selectedDifficulty = 0;
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Desabilita o botão de próxima questão até que uma dificuldade seja selecionada
    document.getElementById('next-question-btn').disabled = true;
}

/**
 * Manipula a resposta do usuário
 * @param {number} selectedIndex - Índice da opção selecionada
 */
function handleAnswer(selectedIndex) {
    // Obtém a questão atual
    let question;
    let questionIndex;
    
    if (isReviewMode) {
        const reviewItem = reviewQuestions[currentQuestionIndex];
        questionIndex = reviewItem.index;
        question = getModuleQuestions(currentModule)[questionIndex];
    } else {
        question = currentQuestions[currentQuestionIndex];
        questionIndex = currentQuestionIndex;
    }
    
    const correctIndex = question.correctIndex;
    const isCorrect = selectedIndex === correctIndex;
    
    // Atualiza o contador de respostas
    if (isCorrect) {
        correctAnswers++;
        document.getElementById('correct-count').textContent = `Corretas: ${correctAnswers}`;
    } else {
        incorrectAnswers++;
        document.getElementById('incorrect-count').textContent = `Incorretas: ${incorrectAnswers}`;
    }
    
    // Marca as opções como corretas ou incorretas
    const optionButtons = document.querySelectorAll('.option-btn');
    
    optionButtons.forEach(button => {
        const index = parseInt(button.dataset.index);
        
        if (index === correctIndex) {
            button.classList.add('correct');
        } else if (index === selectedIndex) {
            button.classList.add('incorrect');
        }
        
        // Desabilita todos os botões
        button.disabled = true;
    });
    
    // Mostra a explicação
    document.getElementById('explanation-text').textContent = question.explanation;
    document.getElementById('explanation-container').classList.remove('d-none');
    
    // Adiciona efeito de pulse ao container de explicação
    document.getElementById('explanation-container').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('explanation-container').classList.remove('pulse');
    }, 500);
}

/**
 * Avança para a próxima questão
 */
function nextQuestion() {
    // Verifica se uma dificuldade foi selecionada
    if (selectedDifficulty === 0) {
        alert('Por favor, selecione o nível de dificuldade da questão antes de continuar.');
        return;
    }
    
    // Atualiza o progresso da questão atual
    let questionIndex;
    let isCorrect;
    
    if (isReviewMode) {
        const reviewItem = reviewQuestions[currentQuestionIndex];
        const module = reviewItem.module;
        questionIndex = reviewItem.index;
        
        // Verifica se a resposta foi correta
        const correctCount = document.querySelectorAll('.option-btn.correct').length;
        const incorrectCount = document.querySelectorAll('.option-btn.incorrect').length;
        isCorrect = correctCount > 0 && incorrectCount === 0;
        
        // Atualiza o progresso
        updateQuestionProgress(module, questionIndex, isCorrect, selectedDifficulty);
    } else {
        questionIndex = currentQuestionIndex;
        
        // Verifica se a resposta foi correta
        const correctCount = document.querySelectorAll('.option-btn.correct').length;
        const incorrectCount = document.querySelectorAll('.option-btn.incorrect').length;
        isCorrect = correctCount > 0 && incorrectCount === 0;
        
        // Atualiza o progresso
        updateQuestionProgress(currentModule, questionIndex, isCorrect, selectedDifficulty);
    }
    
    // Avança para a próxima questão
    currentQuestionIndex++;
    
    // Carrega a próxima questão
    if (isReviewMode) {
        loadReviewQuestion();
    } else {
        loadQuestion();
    }
}

/**
 * Abandona o quiz atual e volta para a seleção de módulos
 */
function quitQuiz() {
    if (confirm('Tem certeza que deseja sair do quiz? Seu progresso será salvo.')) {
        try {
            // Salva o progresso atual do módulo
            if (!isReviewMode) {
                const moduleProgress = {
                    index: currentQuestionIndex,
                    correct: correctAnswers,
                    incorrect: incorrectAnswers,
                    time: quizSeconds
                };
                localStorage.setItem(`quizProgress_${currentModule}`, JSON.stringify(moduleProgress));
                console.log(`Progresso salvo para ${currentModule}:`, moduleProgress);
            }
        } catch (error) {
            console.error("Erro ao salvar progresso:", error);
        }
        
        stopTimer();
        showModuleSelectionScreen();
    }
}

/**
 * Mostra a tela de resultados
 */
function showResultsScreen() {
    stopTimer();
    hideAllScreens();
    screens.results.classList.remove('d-none');
    
    // Calcula a pontuação
    const totalQuestions = correctAnswers + incorrectAnswers;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Atualiza os elementos da tela de resultados
    document.getElementById('score-percentage').textContent = `${scorePercentage}%`;
    document.getElementById('final-correct-count').textContent = correctAnswers;
    document.getElementById('final-incorrect-count').textContent = incorrectAnswers;
    document.getElementById('total-time').textContent = formatTime(quizSeconds);
    
    // Atualiza a cor do círculo de pontuação
    const scoreCircle = document.getElementById('score-circle');
    if (scorePercentage >= 80) {
        scoreCircle.style.borderColor = '#28a745'; // Verde
    } else if (scorePercentage >= 60) {
        scoreCircle.style.borderColor = '#ffc107'; // Amarelo
    } else {
        scoreCircle.style.borderColor = '#dc3545'; // Vermelho
    }
    
    // Gera a análise de desempenho
    generatePerformanceAnalysis();
}

/**
 * Gera a análise de desempenho para a tela de resultados
 */
function generatePerformanceAnalysis() {
    const analysisContainer = document.getElementById('performance-analysis');
    analysisContainer.innerHTML = '';
    
    // Cria uma análise baseada no desempenho
    const totalQuestions = correctAnswers + incorrectAnswers;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    let analysisText = '';
    let recommendations = '';
    
    if (scorePercentage >= 90) {
        analysisText = 'Excelente! Você demonstrou um domínio excepcional do conteúdo.';
        recommendations = 'Continue revisando periodicamente para manter o conhecimento.';
    } else if (scorePercentage >= 80) {
        analysisText = 'Muito bom! Você demonstrou um bom domínio do conteúdo.';
        recommendations = 'Revise os poucos pontos que errou para alcançar a excelência.';
    } else if (scorePercentage >= 70) {
        analysisText = 'Bom! Você está no caminho certo, mas ainda há espaço para melhorias.';
        recommendations = 'Concentre-se nas questões que errou e revise o material correspondente.';
    } else if (scorePercentage >= 60) {
        analysisText = 'Regular. Você precisa revisar mais o conteúdo.';
        recommendations = 'Recomendamos estudar novamente o material e focar nos tópicos que teve mais dificuldade.';
    } else {
        analysisText = 'Você precisa dedicar mais tempo ao estudo deste módulo.';
        recommendations = 'Revise todo o material e utilize o sistema de repetição espaçada para melhorar seu desempenho.';
    }
    
    // Cria os elementos para exibir a análise
    const analysisElement = document.createElement('p');
    analysisElement.textContent = analysisText;
    
    const recommendationsElement = document.createElement('p');
    recommendationsElement.textContent = recommendations;
    
    // Adiciona os elementos ao container
    analysisContainer.appendChild(analysisElement);
    analysisContainer.appendChild(recommendationsElement);
    
    // Adiciona informação sobre a próxima revisão
    if (!isReviewMode) {
        const nextReviewElement = document.createElement('p');
        nextReviewElement.innerHTML = '<strong>Próxima revisão:</strong> Use o botão "Iniciar Revisão Espaçada" na tela principal para revisar as questões que você teve mais dificuldade.';
        analysisContainer.appendChild(nextReviewElement);
    }
}

/**
 * Inicia o timer do quiz
 */
function startTimer() {
    quizStartTime = new Date();
    quizSeconds = 0;
    
    // Atualiza o timer a cada segundo
    quizTimer = setInterval(() => {
        quizSeconds++;
        document.getElementById('timer').textContent = formatTime(quizSeconds);
    }, 1000);
}

/**
 * Para o timer do quiz
 */
function stopTimer() {
    clearInterval(quizTimer);
}

/**
 * Formata o tempo em segundos para o formato MM:SS
 * @param {number} seconds - Tempo em segundos
 * @returns {string} Tempo formatado
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Esconde todas as telas
 */
function hideAllScreens() {
    Object.values(screens).forEach(screen => {
        screen.classList.add('d-none');
    });
}

/**
 * Embaralha um array (algoritmo Fisher-Yates)
 * @param {Array} array - Array a ser embaralhado
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
