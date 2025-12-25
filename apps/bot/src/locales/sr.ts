import type { Messages } from './ru.js';

export const sr: Messages = {
  welcome: '🎯 Dobrodošli u Football psy!\n\nOvo je psihološki test za fudbalere. Opisaću situacije iz igre i reći ćete mi kako biste postupili.',
  help: '📖 Komande:\n/start - Počni ispočetka\n/language - Promeni jezik\n/cancel - Otkaži trenutnu akciju\n/help - Prikaži pomoć',
  cancel: '❌ Akcija otkazana.',
  languageChanged: '✅ Jezik promenjen na srpski.',

  pin: {
    request: '🔐 Unesite PIN kod za pristup testu:',
    invalid: '❌ Neispravan PIN kod. Pokušajte ponovo.',
    invalidFormat: '⚠️ PIN kod mora imati 6 cifara.',
    expired: '⏰ PIN kod je istekao.',
    exhausted: '📊 PIN kod je iskorišćen maksimalan broj puta.',
    inactive: '🚫 PIN kod je neaktivan.',
    attemptsLeft: (n: number) => `Preostalih pokušaja: ${n}`,
    tooManyAttempts: '🚫 Previše pokušaja. Kontaktirajte trenera za novi PIN kod.',
  },

  registration: {
    askName: '👤 Kako se zovete? Unesite vaše ime:',
    askPosition: '⚽ Izaberite vašu poziciju:',
    positions: {
      goalkeeper: '🧤 Golman',
      defender: '🛡️ Odbrana',
      midfielder: '⚡ Vezni',
      forward: '⚽ Napadač',
      staff: '👔 Stručni štab',
    },
    complete: '✅ Odlično! Registracija završena.',
    welcomeBack: (name: string) => `👋 Dobrodošli nazad, ${name}!`,
  },

  session: {
    intro: '🎯 Opisaću situaciju iz igre. Odgovorite tekstom ili glasovnom porukom objašnjavajući kako biste postupili.\n\nOdgovarajte prirodno, kao da objašnjavate saigraču.',
    resuming: '🔄 Imate nedovršenu sesiju. Nastavljamo odakle ste stali.',
    situationNumber: (n: number, total: number) => `📋 Situacija ${n} od ${total}:`,
    waitingAnswer: '✍️ Pošaljite tekstualnu ili glasovnu poruku sa vašim odgovorom...',
    analyzing: '🤔 Analiziram vaš odgovor...',
    clarification: '❓ Dodatno pitanje:',
    waitingClarification: '✍️ Odgovorite na dodatno pitanje tekstom ili glasom...',
    sessionComplete: '✅ Testiranje završeno!',
    sessionAbandoned: '⏹️ Sesija otkazana.',
    alternativeIntro: '💡 Pretpostavimo da neko razmišlja na sledeći način:',
    alternativeQuestion1: '🤔 Zašto vam ovo rešenje ne odgovara?',
    alternativeQuestion2: '🤔 Primenite ovaj odgovor na sebe i kritički razmislite o ovom pristupu - zašto bi mogao da funkcioniše ili ne?',
    alternativeQuestion3: '🤔 Slažete li se sa ovim pristupom? Zašto?',
  },

  result: {
    title: '📊 Vaši rezultati testa:',
    archetype: (name: string, score: number) => `${name}: ${score.toFixed(1)}/10`,
    summary: '📝 Vaš profil:',
    thankYou: '🙌 Odličan posao! Sjajno ste prošli test!\n\n📊 Rezultati će biti dostupni vašem treneru. Razgovarajte o njima na sledećem sastanku.',
  },

  errors: {
    general: '😔 Došlo je do greške. Pokušajte kasnije ili restartujte sa /start',
    notAuthorized: '🔐 Unesite PIN kod za pristup testu.',
    voiceTooShort: '⚠️ Glasovna poruka je prekratka. Objasnite detaljnije.',
    voiceTooLong: '⚠️ Glasovna poruka je predugačka. Držite je ispod 2 minuta.',
    textTooShort: '⚠️ Tekstualna poruka je prekratka. Objasnite detaljnije.',
    transcriptionFailed: '😔 Nije moguće prepoznati glas. Pokušajte ponovo snimiti.',
    noActiveSession: '⚠️ Nemate aktivnu sesiju. Započnite testiranje sa /start',
    answerIrrelevant: '⚠️ Vaš odgovor nije povezan sa opisanom situacijom. Odgovorite ponovo na pitanje.',
  },

  keyboards: {
    startTest: '🎯 Započni Test',
    changeLanguage: '🌐 Promeni Jezik',
    cancel: '❌ Otkaži',
    skip: '⏭️ Preskoči',
    continue: '➡️ Nastavi',
  },
};
