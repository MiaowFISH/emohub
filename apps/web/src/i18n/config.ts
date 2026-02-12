import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'
import LanguageDetector from 'i18next-browser-languagedetector'
import { useSettingsStore } from '@/stores/settingsStore'

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh',
    supportedLngs: ['en', 'zh'],
    defaultNS: 'common',
    ns: ['common', 'settings', 'images'],
    detection: {
      order: ['localStorage', 'navigator'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: true,
    },
  })

// Bidirectional sync between i18next and settingsStore
// i18next -> store: when language changes in i18next, update store
i18n.on('languageChanged', (lng) => {
  useSettingsStore.getState().setLanguage(lng as 'en' | 'zh')
})

// store -> i18next: when language changes in store, update i18next
useSettingsStore.subscribe((state) => {
  if (state.language !== i18n.language) {
    i18n.changeLanguage(state.language)
  }
})

// Initialize i18next with the current store language
const initialLang = useSettingsStore.getState().language
if (initialLang) {
  i18n.changeLanguage(initialLang)
}

export default i18n
