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
    
    // Obtém as questões do módulo
    currentQuestions = getModuleQuestions(module);
    
    // Embaralha as questões
    shuffleArray(currentQuestions);
    
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
            'ATIPICOS': 'Antipsicóticos Atípicos'
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
