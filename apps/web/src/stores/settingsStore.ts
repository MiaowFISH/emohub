import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StateCreator } from 'zustand'

type Theme = 'light' | 'dark' | 'system'
type Language = 'en' | 'zh'

interface SettingsState {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  const html = document.documentElement
  const resolved = resolveTheme(theme)

  // Enable smooth color transitions for theme switch
  html.classList.add('theme-transitioning')

  // Apply the theme
  html.setAttribute('data-theme', resolved)

  // Remove transition class after animation completes (300ms)
  setTimeout(() => {
    html.classList.remove('theme-transitioning')
  }, 350) // Slightly longer than 300ms transition to ensure completion
}

const initializer: StateCreator<SettingsState> = (set) => ({
  theme: 'system',
  language: 'zh',
  setTheme: (theme) => set({ theme }),
  setLanguage: (language) => set({ language })
})

export const useSettingsStore = create<SettingsState>(
  persist(initializer, {
    name: 'emohub-settings',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ theme: state.theme, language: state.language }) as SettingsState
  }) as StateCreator<SettingsState>
)

// Apply theme whenever store changes (including rehydration from localStorage)
useSettingsStore.subscribe((state) => applyTheme(state.theme))

// Apply on initial load
applyTheme(useSettingsStore.getState().theme)

// Follow OS theme changes when set to 'system'
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useSettingsStore.getState().theme === 'system') applyTheme('system')
})
