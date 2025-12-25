import type { Messages } from './ru.js';

export const fr: Messages = {
  welcome: '🎯 Bienvenue sur Football psy!\n\nCeci est un test psychologique pour les footballeurs. Je décrirai des situations de jeu et vous me direz comment vous agiriez.',
  help: '📖 Commandes:\n/start - Recommencer\n/language - Changer de langue\n/cancel - Annuler l\'action en cours\n/help - Afficher l\'aide',
  cancel: '❌ Action annulée.',
  languageChanged: '✅ Langue changée en français.',

  pin: {
    request: '🔐 Entrez votre code PIN pour accéder au test:',
    invalid: '❌ Code PIN invalide. Veuillez réessayer.',
    invalidFormat: '⚠️ Le code PIN doit comporter 6 chiffres.',
    expired: '⏰ Le code PIN a expiré.',
    exhausted: '📊 Le code PIN a été utilisé le nombre maximum de fois.',
    inactive: '🚫 Le code PIN est inactif.',
    attemptsLeft: (n: number) => `Tentatives restantes: ${n}`,
    tooManyAttempts: '🚫 Trop de tentatives. Contactez votre entraîneur pour un nouveau code PIN.',
  },

  registration: {
    askName: '👤 Quel est votre nom? Entrez votre nom:',
    askPosition: '⚽ Sélectionnez votre position:',
    positions: {
      goalkeeper: '🧤 Gardien',
      defender: '🛡️ Défenseur',
      midfielder: '⚡ Milieu',
      forward: '⚽ Attaquant',
      staff: '👔 Staff technique',
    },
    complete: '✅ Super! Inscription terminée.',
    welcomeBack: (name: string) => `👋 Bon retour, ${name}!`,
  },

  session: {
    intro: '🎯 Je vais décrire une situation de jeu. Répondez par texte ou message vocal en expliquant comment vous agiriez.\n\nRépondez naturellement, comme si vous expliquiez à un coéquipier.',
    resuming: '🔄 Vous avez une session inachevée. Reprise là où vous vous êtes arrêté.',
    situationNumber: (n: number, total: number) => `📋 Situation ${n} sur ${total}:`,
    waitingAnswer: '✍️ Envoyez un message texte ou vocal avec votre réponse...',
    analyzing: '🤔 Analyse de votre réponse...',
    clarification: '❓ Question de suivi:',
    waitingClarification: '✍️ Répondez à la question de suivi par texte ou vocal...',
    sessionComplete: '✅ Test terminé!',
    sessionAbandoned: '⏹️ Session annulée.',
    alternativeIntro: '💡 Supposons que quelqu\'un raisonne de la manière suivante:',
    alternativeQuestion1: '🤔 Pourquoi cette solution ne vous convient-elle pas?',
    alternativeQuestion2: '🤔 Appliquez cette réponse à vous-même et réfléchissez de manière critique à cette approche - pourquoi pourrait-elle fonctionner ou non?',
    alternativeQuestion3: '🤔 Êtes-vous d\'accord avec cette approche? Pourquoi?',
  },

  result: {
    title: '📊 Vos résultats de test:',
    archetype: (name: string, score: number) => `${name}: ${score.toFixed(1)}/10`,
    summary: '📝 Votre profil:',
    thankYou: '🙌 Excellent travail! Vous avez très bien réussi le test!\n\n📊 Les résultats seront disponibles pour votre entraîneur. Discutez-en lors de votre prochaine réunion.',
  },

  errors: {
    general: '😔 Une erreur s\'est produite. Réessayez plus tard ou redémarrez avec /start',
    notAuthorized: '🔐 Veuillez entrer votre code PIN pour accéder au test.',
    voiceTooShort: '⚠️ Le message vocal est trop court. Veuillez expliquer plus en détail.',
    voiceTooLong: '⚠️ Le message vocal est trop long. Veuillez le garder sous 2 minutes.',
    textTooShort: '⚠️ Le message texte est trop court. Veuillez expliquer plus en détail.',
    transcriptionFailed: '😔 Impossible de reconnaître la voix. Veuillez réenregistrer.',
    noActiveSession: '⚠️ Vous n\'avez pas de session active. Commencez le test avec /start',
    answerIrrelevant: '⚠️ Votre réponse n\'est pas liée à la situation décrite. Veuillez répondre à nouveau.',
  },

  keyboards: {
    startTest: '🎯 Commencer le Test',
    changeLanguage: '🌐 Changer de Langue',
    cancel: '❌ Annuler',
    skip: '⏭️ Passer',
    continue: '➡️ Continuer',
  },
};
