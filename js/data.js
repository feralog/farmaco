/**
 * data.js - Gerenciamento de dados e carregamento das questões
 * 
 * Este arquivo é responsável por:
 * - Carregar os dados das questões de cada módulo
 * - Gerenciar o armazenamento local dos dados do usuário
 * - Fornecer funções para acessar e manipular os dados
 */

// Objeto para armazenar as questões de todos os módulos
const questionsData = {
    AINES_E_AIES: [],
    Anestesicos_Gerais: [],
    Anestesicos_Locais: [],
    ATIPICOS: [],
    Opoides: []
};

// Objeto para armazenar os dados do usuário
let userData = {
    username: '',
    progress: {
        AINES_E_AIES: {},
        Anestesicos_Gerais: {},
        Anestesicos_Locais: {},
        ATIPICOS: {},
        Opoides: {}
    },
    lastSession: null
};

/**
 * Carrega as questões de todos os módulos
 * @returns {Promise} Promise que resolve quando todos os dados são carregados
 */
function loadAllQuestions() {
    return Promise.all([
        fetch('./questoes_AINES_E_AIES.json')
            .then(response => response.json())
            .then(data => {
                questionsData.AINES_E_AIES = data;
                initializeQuestionProgress('AINES_E_AIES');
            })
            .catch(error => {
                console.error('Erro ao carregar AINES_E_AIES:', error);
                alert('Erro ao carregar questões de AINES E AIES. Verifique o console para mais detalhes.');
            }),
        fetch('./questoes_Anestesicos_Gerais.json')
            .then(response => response.json())
            .then(data => {
                questionsData.Anestesicos_Gerais = data;
                initializeQuestionProgress('Anestesicos_Gerais');
            })
            .catch(error => {
                console.error('Erro ao carregar Anestesicos_Gerais:', error);
                alert('Erro ao carregar questões de Anestésicos Gerais. Verifique o console para mais detalhes.');
            }),
        fetch('./questoes_Anestesicos_Locais.json')
            .then(response => response.json())
            .then(data => {
                questionsData.Anestesicos_Locais = data;
                initializeQuestionProgress('Anestesicos_Locais');
            })
            .catch(error => {
                console.error('Erro ao carregar Anestesicos_Locais:', error);
                alert('Erro ao carregar questões de Anestésicos Locais. Verifique o console para mais detalhes.');
            }),
        fetch('./questoes_ATIPICOS.json')
            .then(response => response.json())
            .then(data => {
                questionsData.ATIPICOS = data;
                initializeQuestionProgress('ATIPICOS');
            })
            .catch(error => {
                console.error('Erro ao carregar ATIPICOS:', error);
                alert('Erro ao carregar questões de Antipsicóticos Atípicos. Verifique o console para mais detalhes.');
            })
    ]);
    // Adicione este novo bloco:
        fetch('./questoes_Opioides.json')
            .then(response => response.json())
            .then(data => {
                questionsData.Opioides = data;
                initializeQuestionProgress('Opioides');
            })
            .catch(error => {
                console.error('Erro ao carregar Opioides:', error);
                alert('Erro ao carregar questões de Opioides. Verifique o console para mais detalhes.');
            })
    );
}

/**
 * Inicializa o progresso para as questões de um módulo específico
 * @param {string} module - Nome do módulo
 */
function initializeQuestionProgress(module) {
    // Para cada questão no módulo, verifica se já existe progresso
    questionsData[module].forEach((question, index) => {
        const questionId = `${module}_${index}`;
        
        // Se não existir progresso para esta questão, inicializa
        if (!userData.progress[module][questionId]) {
            userData.progress[module][questionId] = {
                seen: 0,
                correct: 0,
                incorrect: 0,
                lastSeen: null,
                nextReview: null,
                difficulty: 3, // Dificuldade média por padrão
                easeFactor: 2.5, // Fator de facilidade inicial (padrão do Anki)
                interval: 1 // Intervalo inicial em horas
            };
        }
    });
}

/**
 * Salva os dados do usuário no localStorage
 */
function saveUserData() {
    // Atualiza a data da última sessão
    userData.lastSession = new Date().toISOString();
    
    // Salva no localStorage
    localStorage.setItem('farmacologiaQuizData', JSON.stringify(userData));
}

/**
 * Carrega os dados do usuário do localStorage
 * @returns {boolean} True se os dados foram carregados com sucesso, false caso contrário
 */
function loadUserData() {
    const savedData = localStorage.getItem('farmacologiaQuizData');
    
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            
            // Verifica se os dados têm a estrutura esperada
            if (parsedData.username && parsedData.progress) {
                userData = parsedData;
                return true;
            }
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
        }
    }
    
    return false;
}

/**
 * Define o nome de usuário
 * @param {string} username - Nome de usuário
 */
function setUsername(username) {
    userData.username = username;
    saveUserData();
}

/**
 * Obtém o nome de usuário atual
 * @returns {string} Nome de usuário
 */
function getUsername() {
    return userData.username;
}

/**
 * Obtém as questões de um módulo específico
 * @param {string} module - Nome do módulo
 * @returns {Array} Array de questões do módulo
 */
function getModuleQuestions(module) {
    return questionsData[module] || [];
}

/**
 * Obtém o progresso de um módulo específico
 * @param {string} module - Nome do módulo
 * @returns {Object} Objeto com o progresso do módulo
 */
function getModuleProgress(module) {
    return userData.progress[module] || {};
}

/**
 * Calcula a porcentagem de progresso de um módulo
 * @param {string} module - Nome do módulo
 * @returns {number} Porcentagem de progresso (0-100)
 */
function calculateModuleProgress(module) {
    const progress = getModuleProgress(module);
    const questions = getModuleQuestions(module);
    
    if (questions.length === 0) return 0;
    
    let correctCount = 0;
    let totalQuestions = questions.length;
    
    // Conta quantas questões foram respondidas corretamente pelo menos uma vez
    questions.forEach((_, index) => {
        const questionId = `${module}_${index}`;
        if (progress[questionId] && progress[questionId].seen > 0) {
            correctCount++;
        }
    });
    
    return Math.round((correctCount / totalQuestions) * 100);
}

/**
 * Calcula o progresso geral de todos os módulos
 * @returns {number} Porcentagem de progresso geral (0-100)
 */
function calculateOverallProgress() {
    const modules = Object.keys(questionsData);
    let totalProgress = 0;
    
    modules.forEach(module => {
        totalProgress += calculateModuleProgress(module);
    });
    
    return Math.round(totalProgress / modules.length);
}

/**
 * Atualiza o progresso de uma questão específica
 * @param {string} module - Nome do módulo
 * @param {number} questionIndex - Índice da questão
 * @param {boolean} isCorrect - Se a resposta foi correta
 * @param {number} difficulty - Nível de dificuldade (1-5)
 */
function updateQuestionProgress(module, questionIndex, isCorrect, difficulty) {
    const questionId = `${module}_${questionIndex}`;
    const now = new Date();
    
    // Se não existir progresso para esta questão, inicializa
    if (!userData.progress[module][questionId]) {
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
    }
    
    // Atualiza o progresso
    const questionProgress = userData.progress[module][questionId];
    questionProgress.seen++;
    
    if (isCorrect) {
        questionProgress.correct++;
    } else {
        questionProgress.incorrect++;
    }
    
    questionProgress.lastSeen = now.toISOString();
    questionProgress.difficulty = difficulty;
    
    // Calcula o próximo intervalo de revisão usando o algoritmo de repetição espaçada
    const { nextInterval, newEaseFactor } = calculateNextReview(
        questionProgress.interval,
        questionProgress.easeFactor,
        isCorrect,
        difficulty
    );
    
    questionProgress.interval = nextInterval;
    questionProgress.easeFactor = newEaseFactor;
    
    // Calcula a data da próxima revisão
    const nextReview = new Date(now);
    nextReview.setHours(nextReview.getHours() + nextInterval);
    questionProgress.nextReview = nextReview.toISOString();
    
    // Salva os dados atualizados
    saveUserData();
}

/**
 * Obtém questões para revisão espaçada
 * @param {number} limit - Número máximo de questões a retornar
 * @returns {Array} Array de objetos com módulo e índice das questões para revisão
 */
function getQuestionsForReview(limit = 90) {
    const now = new Date();
    const questionsForReview = [];
    
    // Percorre todos os módulos
    Object.keys(questionsData).forEach(module => {
        const questions = getModuleQuestions(module);
        
        // Percorre todas as questões do módulo
        questions.forEach((_, index) => {
            const questionId = `${module}_${index}`;
            const progress = userData.progress[module][questionId];
            
            // Se a questão nunca foi vista ou está pronta para revisão
            if (!progress.nextReview || new Date(progress.nextReview) <= now) {
                questionsForReview.push({
                    module,
                    index,
                    priority: calculateQuestionPriority(progress)
                });
            }
        });
    });
    
    // Ordena por prioridade (maior primeiro) e limita ao número especificado
    return questionsForReview
        .sort((a, b) => b.priority - a.priority)
        .slice(0, limit);
}

/**
 * Calcula a prioridade de uma questão para revisão
 * @param {Object} progress - Objeto de progresso da questão
 * @returns {number} Valor de prioridade
 */
function calculateQuestionPriority(progress) {
    // Questões nunca vistas têm prioridade máxima
    if (progress.seen === 0) return 100;
    
    // Questões com mais erros têm prioridade maior
    const errorRatio = progress.incorrect / progress.seen;
    
    // Questões mais difíceis têm prioridade maior
    const difficultyFactor = (6 - progress.difficulty) / 5; // Inverte a escala (1-5) -> (1-0)
    
    // Questões vistas há mais tempo têm prioridade maior
    let timeFactor = 0;
    if (progress.lastSeen) {
        const hoursSinceLastSeen = (new Date() - new Date(progress.lastSeen)) / (1000 * 60 * 60);
        timeFactor = Math.min(hoursSinceLastSeen / 24, 1); // Normaliza para máximo de 1 (24 horas)
    }
    
    // Calcula a prioridade combinando os fatores
    return (errorRatio * 40) + (difficultyFactor * 30) + (timeFactor * 30);
}

/**
 * Limpa todos os dados do usuário
 */
function clearUserData() {
    userData = {
        username: '',
        progress: {
            AINES_E_AIES: {},
            Anestesicos_Gerais: {},
            Anestesicos_Locais: {},
            ATIPICOS: {},
            Opioides: {} 
        },
        lastSession: null
    };
    
    localStorage.removeItem('farmacologiaQuizData');
}

// Configura o salvamento automático a cada 10 segundos
setInterval(saveUserData, 10000);

// Configura o salvamento ao fechar a página
window.addEventListener('beforeunload', saveUserData);
