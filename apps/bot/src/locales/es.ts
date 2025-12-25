import type { Messages } from './ru.js';

export const es: Messages = {
  welcome: '🎯 ¡Bienvenido a Football psy!\n\nEsta es una prueba psicológica para futbolistas. Describiré situaciones de juego y me dirás cómo actuarías.',
  help: '📖 Comandos:\n/start - Empezar de nuevo\n/language - Cambiar idioma\n/cancel - Cancelar acción actual\n/help - Mostrar ayuda',
  cancel: '❌ Acción cancelada.',
  languageChanged: '✅ Idioma cambiado a español.',

  pin: {
    request: '🔐 Introduce tu código PIN para acceder a la prueba:',
    invalid: '❌ Código PIN inválido. Inténtalo de nuevo.',
    invalidFormat: '⚠️ El código PIN debe tener 6 dígitos.',
    expired: '⏰ El código PIN ha expirado.',
    exhausted: '📊 El código PIN se ha usado el número máximo de veces.',
    inactive: '🚫 El código PIN está inactivo.',
    attemptsLeft: (n: number) => `Intentos restantes: ${n}`,
    tooManyAttempts: '🚫 Demasiados intentos. Contacta a tu entrenador para un nuevo código PIN.',
  },

  registration: {
    askName: '👤 ¿Cuál es tu nombre? Introduce tu nombre:',
    askPosition: '⚽ Selecciona tu posición:',
    positions: {
      goalkeeper: '🧤 Portero',
      defender: '🛡️ Defensa',
      midfielder: '⚡ Centrocampista',
      forward: '⚽ Delantero',
      staff: '👔 Cuerpo técnico',
    },
    complete: '✅ ¡Genial! Registro completado.',
    welcomeBack: (name: string) => `👋 ¡Bienvenido de nuevo, ${name}!`,
  },

  session: {
    intro: '🎯 Describiré una situación de juego. Responde con texto o mensaje de voz explicando cómo actuarías.\n\nResponde naturalmente, como si explicaras a un compañero de equipo.',
    resuming: '🔄 Tienes una sesión sin terminar. Continuando desde donde lo dejaste.',
    situationNumber: (n: number, total: number) => `📋 Situación ${n} de ${total}:`,
    waitingAnswer: '✍️ Envía un mensaje de texto o voz con tu respuesta...',
    analyzing: '🤔 Analizando tu respuesta...',
    clarification: '❓ Pregunta de seguimiento:',
    waitingClarification: '✍️ Responde a la pregunta de seguimiento con texto o voz...',
    sessionComplete: '✅ ¡Prueba completada!',
    sessionAbandoned: '⏹️ Sesión cancelada.',
    alternativeIntro: '💡 Supongamos que alguien razona de la siguiente manera:',
    alternativeQuestion1: '🤔 ¿Por qué esta solución no funciona para ti?',
    alternativeQuestion2: '🤔 Aplica esta respuesta a ti mismo y piensa críticamente sobre este enfoque - ¿por qué podría funcionar o no?',
    alternativeQuestion3: '🤔 ¿Estás de acuerdo con este enfoque? ¿Por qué?',
  },

  result: {
    title: '📊 Tus resultados de la prueba:',
    archetype: (name: string, score: number) => `${name}: ${score.toFixed(1)}/10`,
    summary: '📝 Tu perfil:',
    thankYou: '🙌 ¡Buen trabajo! ¡Lo hiciste excelente en la prueba!\n\n📊 Los resultados estarán disponibles para tu entrenador. Discútelos en tu próxima reunión.',
  },

  delete: {
    confirm: '⚠️ ¿Estás seguro de que quieres eliminar tu perfil?\n\nEsta acción no se puede deshacer. Todos tus datos, incluidos los resultados de las pruebas, serán eliminados.',
    success: '✅ Tu perfil ha sido eliminado con éxito.',
    notFound: '❌ Perfil no encontrado. Es posible que aún no hayas realizado la prueba.',
    cancelled: '🚫 Eliminación cancelada.',
  },

  errors: {
    general: '😔 Ocurrió un error. Inténtalo más tarde o reinicia con /start',
    notAuthorized: '🔐 Introduce tu código PIN para acceder a la prueba.',
    voiceTooShort: '⚠️ El mensaje de voz es muy corto. Explica con más detalle.',
    voiceTooLong: '⚠️ El mensaje de voz es muy largo. Mantenlo bajo 2 minutos.',
    textTooShort: '⚠️ El mensaje de texto es muy corto. Explica con más detalle.',
    transcriptionFailed: '😔 No se pudo reconocer la voz. Intenta grabar de nuevo.',
    noActiveSession: '⚠️ No tienes una sesión activa. Comienza la prueba con /start',
    answerIrrelevant: '⚠️ Tu respuesta no está relacionada con la situación descrita. Responde la pregunta de nuevo.',
  },

  keyboards: {
    startTest: '🎯 Iniciar Prueba',
    changeLanguage: '🌐 Cambiar Idioma',
    cancel: '❌ Cancelar',
    skip: '⏭️ Saltar',
    continue: '➡️ Continuar',
    confirmDelete: '🗑️ Sí, eliminar',
  },
};
