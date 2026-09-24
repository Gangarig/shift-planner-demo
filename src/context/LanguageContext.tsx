import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Language = 'en' | 'de'

const messages = {
  en: {
    dashboard: 'Dashboard',
    planner: 'Planner',
    payroll: 'Leave & Payroll',
    workers: 'Workers',
    stations: 'Stations',
    team: 'Team & Access',
    audit: 'Audit history',
    settings: 'Settings',
    workspace: 'Workspace',
    guide: 'User guide',
    navigation: 'Navigation',
    language: 'Language',
    english: 'English',
    german: 'Deutsch',
    light: 'Light',
    dark: 'Dark',
    logOut: 'Log out',
    toggleColorScheme: 'Toggle color scheme',
  },
  de: {
    dashboard: 'Übersicht',
    planner: 'Planer',
    payroll: 'Abwesenheit & Lohn',
    workers: 'Mitarbeitende',
    stations: 'Stationen',
    team: 'Team & Zugänge',
    audit: 'Änderungsverlauf',
    settings: 'Einstellungen',
    workspace: 'Arbeitsbereich',
    guide: 'Benutzerhandbuch',
    navigation: 'Navigation',
    language: 'Sprache',
    english: 'English',
    german: 'Deutsch',
    light: 'Hell',
    dark: 'Dunkel',
    logOut: 'Abmelden',
    toggleColorScheme: 'Farbschema wechseln',
  },
} as const

export type MessageKey = keyof typeof messages.en
interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: MessageKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() =>
    localStorage.getItem('shiftplanner-language') === 'de' ? 'de' : 'en',
  )

  useEffect(() => {
    localStorage.setItem('shiftplanner-language', language)
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: MessageKey) => messages[language][key],
    }),
    [language],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context)
    throw new Error('useLanguage must be used within LanguageProvider')
  return context
}
