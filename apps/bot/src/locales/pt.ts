import type { Messages } from './ru.js';

export const pt: Messages = {
  welcome: '🎯 Bem-vindo ao Football psy!\n\nEste é um teste psicológico para jogadores de futebol. Vou descrever situações de jogo e você me dirá como agiria.',
  help: '📖 Comandos:\n/start - Recomeçar\n/language - Mudar idioma\n/cancel - Cancelar ação atual\n/help - Mostrar ajuda',
  cancel: '❌ Ação cancelada.',
  languageChanged: '✅ Idioma alterado para português.',

  pin: {
    request: '🔐 Digite seu código PIN para acessar o teste:',
    invalid: '❌ Código PIN inválido. Tente novamente.',
    invalidFormat: '⚠️ O código PIN deve ter 6 dígitos.',
    expired: '⏰ O código PIN expirou.',
    exhausted: '📊 O código PIN foi usado o número máximo de vezes.',
    inactive: '🚫 O código PIN está inativo.',
    attemptsLeft: (n: number) => `Tentativas restantes: ${n}`,
    tooManyAttempts: '🚫 Muitas tentativas. Entre em contato com seu treinador para um novo código PIN.',
  },

  registration: {
    askName: '👤 Qual é o seu nome? Digite seu nome:',
    askPosition: '⚽ Selecione sua posição:',
    nameTooLong: '❌ O nome é muito longo. Por favor, digite um nome com menos de 50 caracteres.',
    positions: {
      goalkeeper: '🧤 Goleiro',
      defender: '🛡️ Defensor',
      midfielder: '⚡ Meio-campista',
      forward: '⚽ Atacante',
      staff: '👔 Comissão técnica',
    },
    complete: '✅ Ótimo! Registro concluído.',
    welcomeBack: (name: string) => `👋 Bem-vindo de volta, ${name}!`,
  },

  session: {
    intro: '🎯 Vou descrever uma situação de jogo. Responda com texto ou mensagem de voz explicando como você agiria.\n\nResponda naturalmente, como se estivesse explicando a um companheiro de equipe.',
    resuming: '🔄 Você tem uma sessão inacabada. Continuando de onde parou.',
    situationNumber: (n: number, total: number) => `📋 Situação ${n} de ${total}:`,
    waitingAnswer: '✍️ Envie uma mensagem de texto ou voz com sua resposta...',
    analyzing: '🤔 Analisando sua resposta...',
    clarification: '❓ Pergunta de acompanhamento:',
    waitingClarification: '✍️ Responda à pergunta de acompanhamento com texto ou voz...',
    sessionComplete: '✅ Teste concluído!',
    sessionAbandoned: '⏹️ Sessão cancelada.',
    alternativeIntro: '💡 Vamos supor que alguém raciocine da seguinte forma:',
    alternativeQuestion1: '🤔 Por que essa solução não funciona para você?',
    alternativeQuestion2: '🤔 Aplique esta resposta a si mesmo e pense criticamente sobre esta abordagem - por que pode funcionar ou não?',
    alternativeQuestion3: '🤔 Você concorda com esta abordagem? Por quê?',
  },

  result: {
    title: '📊 Seus resultados do teste:',
    archetype: (name: string, score: number) => `${name}: ${score.toFixed(1)}/10`,
    summary: '📝 Seu perfil:',
    thankYou: '🙌 Ótimo trabalho! Você foi excelente no teste!\n\n📊 Os resultados estarão disponíveis para seu treinador. Discuta-os em sua próxima reunião.',
  },

  delete: {
    confirm: '⚠️ Tem certeza de que deseja excluir seu perfil?\n\nEsta ação não pode ser desfeita. Todos os seus dados, incluindo resultados de testes, serão excluídos.',
    success: '✅ Seu perfil foi excluído com sucesso.',
    notFound: '❌ Perfil não encontrado. Você pode ainda não ter feito o teste.',
    cancelled: '🚫 Exclusão cancelada.',
  },

  errors: {
    general: '😔 Ocorreu um erro. Tente novamente mais tarde ou reinicie com /start',
    notAuthorized: '🔐 Digite seu código PIN para acessar o teste.',
    voiceTooShort: '⚠️ A mensagem de voz é muito curta. Explique com mais detalhes.',
    voiceTooLong: '⚠️ A mensagem de voz é muito longa. Mantenha abaixo de 2 minutos.',
    textTooShort: '⚠️ A mensagem de texto é muito curta. Explique com mais detalhes.',
    transcriptionFailed: '😔 Não foi possível reconhecer a voz. Tente gravar novamente.',
    noActiveSession: '⚠️ Você não tem uma sessão ativa. Inicie o teste com /start',
    answerIrrelevant: '⚠️ Sua resposta não está relacionada à situação descrita. Responda à pergunta novamente.',
  },

  keyboards: {
    startTest: '🎯 Iniciar Teste',
    changeLanguage: '🌐 Mudar Idioma',
    cancel: '❌ Cancelar',
    skip: '⏭️ Pular',
    continue: '➡️ Continuar',
    confirmDelete: '🗑️ Sim, excluir',
  },

  wave: {
    notification: (teamName: string) => `🏟️ A equipe "${teamName}" iniciou uma nova onda de testes!\n\nClique no botão abaixo para fazer o teste.`,
    startTestButton: '⚽ Fazer Teste',
    alreadyStarted: '🔄 Você já começou os testes. Continue sua sessão atual.',
  },
};
