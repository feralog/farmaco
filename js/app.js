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
        // Defina as questões diretamente - CORRIGIDO: removido o array aninhado extra
        currentQuestions = [
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
            }
        ];
        
        // Continua com o fluxo normal
        startQuizFlow();
        return;
    }
    
    // Para outros módulos, carrega as questões normalmente
    if (questionsData[module] && questionsData[module].length > 0) {
        currentQuestions = questionsData[module];
        startQuizFlow();
    } else {
        alert(`Erro: Não foi possível carregar as questões do módulo ${module}.`);
        showModuleSelectionScreen();
    }
}

/**
 * Inicia o fluxo do quiz após carregar as questões
 */
function startQuizFlow() {
    // Reinicia as variáveis
    currentQuestionIndex = 0;
    correctAnswers = 0;
    incorrectAnswers = 0;
    
    // Embaralha as questões
    if (!isReviewMode) {
        shuffleArray(currentQuestions);
    }
    
    // Inicia o timer
    startTimer();
    
    // Mostra a tela do quiz
    showQuizScreen();
    
    // Carrega a primeira questão
    loadQuestion();
}

/**
 * Inicia o modo de revisão espaçada
 */
function startSpacedRepetition() {
    // Obtém as questões para revisão
    reviewQuestions = getQuestionsForReview();
    
    if (reviewQuestions.length === 0) {
        alert('Não há questões para revisar no momento. Continue praticando os módulos para adicionar questões à revisão.');
        return;
    }
    
    // Configura o modo de revisão
    isReviewMode = true;
    currentModule = 'Revisão';
    currentQuestions = reviewQuestions;
    
    // Inicia o fluxo do quiz
    startQuizFlow();
}

/**
 * Carrega a questão atual
 */
function loadQuestion() {
    // Verifica se ainda há questões
    if (currentQuestionIndex >= currentQuestions.length) {
        finishQuiz();
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    
    // Atualiza o título do módulo
    document.getElementById('quiz-module-title').textContent = isReviewMode ? 'Revisão Espaçada' : currentModule;
    
    // Atualiza o contador de questões
    document.getElementById('question-counter').textContent = `Questão ${currentQuestionIndex + 1} de ${currentQuestions.length}`;
    
    // Atualiza o texto da questão
    document.getElementById('question-text').textContent = question.question;
    
    // Limpa as opções anteriores
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    // Adiciona as novas opções
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option mb-2 p-3 border rounded';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        optionElement.addEventListener('click', () => selectOption(optionElement, index));
        
        optionsContainer.appendChild(optionElement);
    });
    
    // Esconde a explicação
    document.getElementById('explanation-container').classList.add('d-none');
    
    // Reseta os botões de dificuldade
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('selected'));
    
    // Desabilita o botão de próxima questão
    document.getElementById('next-question-btn').disabled = true;
    
    // Esconde os botões de dificuldade
    document.getElementById('difficulty-container').classList.add('d-none');
}

/**
 * Seleciona uma opção de resposta
 * @param {HTMLElement} optionElement - Elemento da opção
 * @param {number} index - Índice da opção
 */
function selectOption(optionElement, index) {
    // Verifica se já foi selecionada uma opção
    if (document.querySelector('.option.selected')) {
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = index === question.correctIndex;
    
    // Marca a opção selecionada
    optionElement.classList.add('selected');
    
    // Adiciona a classe de correto ou incorreto
    if (isCorrect) {
        optionElement.classList.add('correct');
        correctAnswers++;
    } else {
        optionElement.classList.add('incorrect');
        incorrectAnswers++;
        
        // Destaca a opção correta
        const options = document.querySelectorAll('.option');
        options[question.correctIndex].classList.add('correct');
    }
    
    // Mostra a explicação
    const explanationContainer = document.getElementById('explanation-container');
    explanationContainer.classList.remove('d-none');
    document.getElementById('explanation-text').textContent = question.explanation;
    
    // Mostra os botões de dificuldade
    document.getElementById('difficulty-container').classList.remove('d-none');
    
    // Atualiza o progresso do usuário
    if (isReviewMode) {
        updateReviewProgress(question, isCorrect);
    } else {
        updateQuestionProgress(currentModule, question, isCorrect);
    }
}

/**
 * Avança para a próxima questão
 */
function nextQuestion() {
    // Verifica se foi selecionada uma opção
    if (!document.querySelector('.option.selected')) {
        alert('Por favor, selecione uma opção antes de continuar.');
        return;
    }
    
    // Verifica se foi selecionada uma dificuldade
    if (document.getElementById('difficulty-container').classList.contains('d-none') === false && 
        !document.querySelector('.difficulty-btn.selected')) {
        alert('Por favor, avalie a dificuldade da questão antes de continuar.');
        return;
    }
    
    // Atualiza a dificuldade da questão
    if (isReviewMode) {
        updateQuestionDifficulty(currentQuestions[currentQuestionIndex], selectedDifficulty);
    }
    
    // Avança para a próxima questão
    currentQuestionIndex++;
    loadQuestion();
}

/**
 * Finaliza o quiz
 */
function finishQuiz() {
    // Para o timer
    stopTimer();
    
    // Calcula a pontuação
    const totalQuestions = correctAnswers + incorrectAnswers;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    
    // Atualiza os elementos da tela de resultados
    document.getElementById('results-module-title').textContent = isReviewMode ? 'Revisão Espaçada' : currentModule;
    document.getElementById('results-score').textContent = `${score}%`;
    document.getElementById('results-correct').textContent = correctAnswers;
    document.getElementById('results-incorrect').textContent = incorrectAnswers;
    document.getElementById('results-time').textContent = formatTime(quizSeconds);
    
    // Mostra a tela de resultados
    showResultsScreen();
}

/**
 * Abandona o quiz atual
 */
function quitQuiz() {
    if (confirm('Tem certeza que deseja abandonar o quiz? Seu progresso será perdido.')) {
        stopTimer();
        showModuleSelectionScreen();
    }
}

/**
 * Inicia o timer do quiz
 */
function startTimer() {
    quizStartTime = new Date();
    quizSeconds = 0;
    
    quizTimer = setInterval(() => {
        quizSeconds++;
        document.getElementById('timer-display').textContent = formatTime(quizSeconds);
    }, 1000);
}

/**
 * Para o timer do quiz
 */
function stopTimer() {
    clearInterval(quizTimer);
}

/**
 * Formata o tempo em minutos e segundos
 * @param {number} seconds - Tempo em segundos
 * @returns {string} Tempo formatado
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

/**
 * Esconde todas as telas
 */
function hideAllScreens() {
    Object.values(screens).forEach(screen => screen.classList.add('d-none'));
}

/**
 * Mostra a tela do quiz
 */
function showQuizScreen() {
    hideAllScreens();
    screens.quiz.classList.remove('d-none');
}

/**
 * Mostra a tela de resultados
 */
function showResultsScreen() {
    hideAllScreens();
    screens.results.classList.remove('d-none');
}

/**
 * Embaralha um array
 * @param {Array} array - Array a ser embaralhado
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
