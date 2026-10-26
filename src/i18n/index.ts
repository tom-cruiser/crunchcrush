import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { LocaleCode } from '@/types'
import en from './locales/en'
import fr from './locales/fr'
import rw from './locales/rw'

export const LANGUAGES: { code: LocaleCode; label: string; ready: boolean }[] = [
  { code: 'en', label: 'English', ready: true },
  { code: 'fr', label: 'Français', ready: false },
  { code: 'rw', label: 'Kinyarwanda', ready: false },
]

const STORAGE_KEY = 'cc-lang'

function initialLanguage(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as LocaleCode | null
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    // ignore
  }
  return 'en'
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr }, rw: { translation: rw } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // ignore
  }
})

export default i18n
