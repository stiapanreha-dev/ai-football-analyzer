import type { Messages } from './ru.js';

export const en: Messages = {
  welcome: '🎯 Welcome to Football psy!\n\nThis is a psychological test for football players. I will describe game situations and you will tell me how you would act.',
  help: '📖 Commands:\n/start - Start over\n/language - Change language\n/cancel - Cancel current action\n/help - Show help',
  cancel: '❌ Action cancelled.',
  languageChanged: '✅ Language changed to English.',

  pin: {
    request: '🔐 Enter your PIN code to access the test:',
    invalid: '❌ Invalid PIN code. Please try again.',
    invalidFormat: '⚠️ PIN code must be 6 digits.',
    expired: '⏰ PIN code has expired.',
    exhausted: '📊 PIN code has been used the maximum number of times.',
    inactive: '🚫 PIN code is inactive.',
    attemptsLeft: (n: number) => `Attempts left: ${n}`,
    tooManyAttempts: '🚫 Too many attempts. Please contact your coach for a new PIN code.',
  },

  registration: {
    askName: '👤 What is your name? Enter your name:',
    askPosition: '⚽ Select your position:',
    positions: {
      goalkeeper: '🧤 Goalkeeper',
      defender: '🛡️ Defender',
      midfielder: '⚡ Midfielder',
      forward: '⚽ Forward',
      staff: '👔 Coaching Staff',
    },
    complete: '✅ Great! Registration complete.',
    welcomeBack: (name: string) => `👋 Welcome back, ${name}!`,
  },

  session: {
    intro: '🎯 I will describe a game situation. Reply with text or a voice message explaining how you would act.\n\nAnswer naturally, as if explaining to a teammate.',
    resuming: '🔄 You have an unfinished session. Continuing from where you left off.',
    situationNumber: (n: number, total: number) => `📋 Situation ${n} of ${total}:`,
    waitingAnswer: '✍️ Send a text or voice message with your answer...',
    analyzing: '🤔 Analyzing your answer...',
    clarification: '❓ Follow-up question:',
    waitingClarification: '✍️ Answer the follow-up question with text or voice...',
    sessionComplete: '✅ Testing complete!',
    sessionAbandoned: '⏹️ Session cancelled.',
    alternativeIntro: "💡 Let's assume someone reasons as follows:",
    alternativeQuestion1: '🤔 Why doesn\'t this solution work for you?',
    alternativeQuestion2: '🤔 Apply this answer to yourself and think critically about this approach - why might it work or not?',
    alternativeQuestion3: '🤔 Do you agree with this approach? Why?',
  },

  result: {
    title: '📊 Your test results:',
    archetype: (name: string, score: number) => `${name}: ${score.toFixed(1)}/10`,
    summary: '📝 Your profile:',
    thankYou: '🙌 Great job! You did excellent in the test!\n\n📊 Results will be available to your coach. Discuss them at your next meeting.',
  },

  delete: {
    confirm: '⚠️ Are you sure you want to delete your profile?\n\nThis action cannot be undone. All your data, including test results, will be deleted.',
    success: '✅ Your profile has been successfully deleted.',
    notFound: '❌ Profile not found. You may not have taken the test yet.',
    cancelled: '🚫 Deletion cancelled.',
  },

  errors: {
    general: '😔 An error occurred. Please try again later or restart with /start',
    notAuthorized: '🔐 Please enter your PIN code to access the test.',
    voiceTooShort: '⚠️ Voice message is too short. Please explain in more detail.',
    voiceTooLong: '⚠️ Voice message is too long. Please keep it under 2 minutes.',
    textTooShort: '⚠️ Text message is too short. Please explain in more detail.',
    transcriptionFailed: '😔 Could not recognize voice. Please try recording again.',
    noActiveSession: '⚠️ You have no active session. Start testing with /start',
    answerIrrelevant: '⚠️ Your answer is not related to the described situation. Please answer the question again.',
  },

  keyboards: {
    startTest: '🎯 Start Test',
    changeLanguage: '🌐 Change Language',
    cancel: '❌ Cancel',
    skip: '⏭️ Skip',
    continue: '➡️ Continue',
    confirmDelete: '🗑️ Yes, delete',
  },
};
