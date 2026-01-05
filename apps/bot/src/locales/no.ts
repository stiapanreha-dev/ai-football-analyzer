import type { Messages } from './ru.js';

export const no: Messages = {
  welcome: '🎯 Velkommen til Football psy!\n\nDette er en psykologisk test for fotballspillere. Jeg vil beskrive spillsituasjoner og du forteller meg hvordan du ville handlet.',
  help: '📖 Kommandoer:\n/start - Start på nytt\n/language - Bytt språk\n/cancel - Avbryt gjeldende handling\n/help - Vis hjelp',
  cancel: '❌ Handling avbrutt.',
  languageChanged: '✅ Språk endret til norsk.',

  pin: {
    request: '🔐 Skriv inn PIN-koden din for å få tilgang til testen:',
    invalid: '❌ Ugyldig PIN-kode. Prøv igjen.',
    invalidFormat: '⚠️ PIN-koden må være 6 sifre.',
    expired: '⏰ PIN-koden har utløpt.',
    exhausted: '📊 PIN-koden har blitt brukt maksimalt antall ganger.',
    inactive: '🚫 PIN-koden er inaktiv.',
    attemptsLeft: (n: number) => `Forsøk igjen: ${n}`,
    tooManyAttempts: '🚫 For mange forsøk. Kontakt treneren din for en ny PIN-kode.',
  },

  registration: {
    askName: '👤 Hva heter du? Skriv inn navnet ditt:',
    askPosition: '⚽ Velg din posisjon:',
    nameTooLong: '❌ Navnet er for langt. Vennligst skriv inn et navn med mindre enn 50 tegn.',
    positions: {
      goalkeeper: '🧤 Keeper',
      defender: '🛡️ Forsvar',
      midfielder: '⚡ Midtbane',
      forward: '⚽ Angrep',
      staff: '👔 Trenerteam',
    },
    complete: '✅ Flott! Registrering fullført.',
    welcomeBack: (name: string) => `👋 Velkommen tilbake, ${name}!`,
  },

  session: {
    intro: '🎯 Jeg vil beskrive en spillsituasjon. Svar med tekst eller talemelding og forklar hvordan du ville handlet.\n\nSvar naturlig, som om du forklarer til en lagkamerat.',
    resuming: '🔄 Du har en uferdig økt. Fortsetter der du slapp.',
    situationNumber: (n: number, total: number) => `📋 Situasjon ${n} av ${total}:`,
    waitingAnswer: '✍️ Send en tekst- eller talemelding med svaret ditt...',
    analyzing: '🤔 Analyserer svaret ditt...',
    clarification: '❓ Oppfølgingsspørsmål:',
    waitingClarification: '✍️ Svar på oppfølgingsspørsmålet med tekst eller tale...',
    sessionComplete: '✅ Testing fullført!',
    sessionAbandoned: '⏹️ Økt avbrutt.',
    alternativeIntro: '💡 La oss anta at noen resonnerer på følgende måte:',
    alternativeQuestion1: '🤔 Hvorfor fungerer ikke denne løsningen for deg?',
    alternativeQuestion2: '🤔 Bruk dette svaret på deg selv og tenk kritisk over denne tilnærmingen - hvorfor kan det fungere eller ikke?',
    alternativeQuestion3: '🤔 Er du enig i denne tilnærmingen? Hvorfor?',
  },

  result: {
    title: '📊 Dine testresultater:',
    archetype: (name: string, score: number) => `${name}: ${score.toFixed(1)}/10`,
    summary: '📝 Din profil:',
    thankYou: '🙌 Flott jobbet! Du gjorde det utmerket på testen!\n\n📊 Resultatene vil være tilgjengelige for treneren din. Diskuter dem på neste møte.',
  },

  delete: {
    confirm: '⚠️ Er du sikker på at du vil slette profilen din?\n\nDenne handlingen kan ikke angres. Alle dine data, inkludert testresultater, vil bli slettet.',
    success: '✅ Profilen din er slettet.',
    notFound: '❌ Profil ikke funnet. Du har kanskje ikke tatt testen ennå.',
    cancelled: '🚫 Sletting avbrutt.',
  },

  errors: {
    general: '😔 Det oppstod en feil. Prøv igjen senere eller start på nytt med /start',
    notAuthorized: '🔐 Skriv inn PIN-koden din for å få tilgang til testen.',
    voiceTooShort: '⚠️ Talemeldingen er for kort. Forklar mer detaljert.',
    voiceTooLong: '⚠️ Talemeldingen er for lang. Hold den under 2 minutter.',
    textTooShort: '⚠️ Tekstmeldingen er for kort. Forklar mer detaljert.',
    transcriptionFailed: '😔 Kunne ikke gjenkjenne tale. Prøv å ta opp igjen.',
    noActiveSession: '⚠️ Du har ingen aktiv økt. Start testing med /start',
    answerIrrelevant: '⚠️ Svaret ditt er ikke relatert til den beskrevne situasjonen. Svar på spørsmålet igjen.',
  },

  keyboards: {
    startTest: '🎯 Start Test',
    changeLanguage: '🌐 Bytt Språk',
    cancel: '❌ Avbryt',
    skip: '⏭️ Hopp over',
    continue: '➡️ Fortsett',
    confirmDelete: '🗑️ Ja, slett',
  },

  wave: {
    notification: (teamName: string) => `🏟️ Laget "${teamName}" har startet en ny testbølge!\n\nKlikk på knappen nedenfor for å ta testen.`,
    startTestButton: '⚽ Ta Test',
    alreadyStarted: '🔄 Du har allerede startet testingen. Fortsett din nåværende økt.',
  },
};
