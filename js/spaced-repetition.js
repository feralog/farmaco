/**
 * spaced-repetition.js - Implementação do algoritmo de repetição espaçada
 * 
 * Este arquivo implementa um algoritmo de repetição espaçada similar ao Anki,
 * adaptado para o contexto de um quiz de farmacologia.
 */

/**
 * Calcula o próximo intervalo de revisão e o novo fator de facilidade
 * baseado no algoritmo SM-2 (usado pelo Anki com adaptações)
 * 
 * @param {number} currentInterval - Intervalo atual em horas
 * @param {number} easeFactor - Fator de facilidade atual
 * @param {boolean} wasCorrect - Se a resposta foi correta
 * @param {number} difficulty - Nível de dificuldade (1-5)
 * @returns {Object} Objeto com o próximo intervalo e o novo fator de facilidade
 */
function calculateNextReview(currentInterval, easeFactor, wasCorrect, difficulty) {
    // Converte a dificuldade (1-5) para a escala do SM-2 (0-5)
    // 1 = Muito difícil -> 0
    // 5 = Muito fácil -> 5
    const qualityResponse = difficulty - 1;
    
    let nextInterval = currentInterval;
    let newEaseFactor = easeFactor;
    
    // Se a resposta foi incorreta, reduzimos o intervalo
    if (!wasCorrect) {
        // Reseta o intervalo para 1 hora (ou menos, dependendo da dificuldade)
        nextInterval = Math.max(1, 3 - difficulty);
        
        // Reduz o fator de facilidade, mas não abaixo de 1.3
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
        // Atualiza o fator de facilidade baseado na dificuldade reportada
        newEaseFactor = easeFactor + (0.1 - (5 - qualityResponse) * (0.08 + (5 - qualityResponse) * 0.02));
        newEaseFactor = Math.max(1.3, newEaseFactor);
        
        // Calcula o próximo intervalo
        if (currentInterval === 1) {
            // Primeira revisão bem-sucedida
            nextInterval = 6; // 6 horas
        } else if (currentInterval <= 6) {
            // Segunda revisão bem-sucedida
            nextInterval = 24; // 1 dia
        } else {
            // Revisões subsequentes
            nextInterval = Math.round(currentInterval * newEaseFactor);
            
            // Ajusta baseado na dificuldade reportada
            if (difficulty <= 2) { // Difícil ou muito difícil
                nextInterval = Math.max(nextInterval / 2, 24); // Pelo menos 1 dia
            } else if (difficulty >= 4) { // Fácil ou muito fácil
                nextInterval = nextInterval * 1.2; // 20% mais tempo
            }
        }
    }
    
    // Limita o intervalo máximo a 30 dias (720 horas)
    nextInterval = Math.min(nextInterval, 720);
    
    return {
        nextInterval,
        newEaseFactor
    };
}

/**
 * Formata um intervalo de tempo em horas para uma representação mais amigável
 * 
 * @param {number} hours - Número de horas
 * @returns {string} Representação formatada do intervalo
 */
function formatInterval(hours) {
    if (hours < 1) {
        return `${Math.round(hours * 60)} minutos`;
    } else if (hours < 24) {
        return hours === 1 ? "1 hora" : `${hours} horas`;
    } else {
        const days = Math.floor(hours / 24);
        return days === 1 ? "1 dia" : `${days} dias`;
    }
}

/**
 * Calcula o tempo restante até a próxima revisão
 * 
 * @param {string} nextReviewDate - Data da próxima revisão em formato ISO
 * @returns {string} Tempo restante formatado
 */
function getTimeUntilNextReview(nextReviewDate) {
    if (!nextReviewDate) return "Disponível agora";
    
    const now = new Date();
    const nextReview = new Date(nextReviewDate);
    
    // Se a data já passou, está disponível agora
    if (nextReview <= now) return "Disponível agora";
    
    const diffMs = nextReview - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return `Em ${formatInterval(diffHours)}`;
}

/**
 * Determina a cor de fundo baseada no nível de dificuldade
 * 
 * @param {number} difficulty - Nível de dificuldade (1-5)
 * @returns {string} Código de cor CSS
 */
function getDifficultyColor(difficulty) {
    const colors = [
        '#dc3545', // Muito difícil - Vermelho
        '#fd7e14', // Difícil - Laranja
        '#6c757d', // Médio - Cinza
        '#0d6efd', // Fácil - Azul
        '#198754'  // Muito fácil - Verde
    ];
    
    return colors[difficulty - 1] || colors[2]; // Padrão para médio
}

/**
 * Gera uma descrição textual do status de aprendizado de uma questão
 * 
 * @param {Object} progress - Objeto de progresso da questão
 * @returns {string} Descrição do status
 */
function getLearningStatus(progress) {
    if (!progress || progress.seen === 0) {
        return "Não estudada";
    }
    
    const correctRatio = progress.correct / progress.seen;
    
    if (correctRatio === 1 && progress.seen >= 3) {
        return "Dominada";
    } else if (correctRatio >= 0.8) {
        return "Quase dominada";
    } else if (correctRatio >= 0.6) {
        return "Aprendendo bem";
    } else if (correctRatio >= 0.4) {
        return "Aprendendo";
    } else if (correctRatio > 0) {
        return "Difícil";
    } else {
        return "Ainda não aprendida";
    }
}
