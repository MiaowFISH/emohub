import { useTranslation } from 'react-i18next'
import { useSettingsStore } from '@/stores/settingsStore'

export const SettingsForm = () => {
  const { t, i18n } = useTranslation('settings')
  const { theme, language, setTheme, setLanguage } = useSettingsStore()

  const handleLanguageChange = async (value: 'en' | 'zh') => {
    await i18n.changeLanguage(value)
    setLanguage(value)
  }

  return (
    <div style={{
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Theme Section */}
      <fieldset style={{
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)'
      }}>
        <legend style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '0 0.5rem',
          color: 'var(--color-text-primary)'
        }}>
          {t('appearance.title')}
        </legend>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="theme"
              value="light"
              checked={theme === 'light'}
              onChange={(e) => setTheme(e.target.value as 'light')}
              style={{ marginRight: '0.75rem', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>{t('appearance.light')}</span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={(e) => setTheme(e.target.value as 'dark')}
              style={{ marginRight: '0.75rem', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>{t('appearance.dark')}</span>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '6px',
            transition: 'background-color 0.2s'
          }}>
            <input
              type="radio"
              name="theme"
              value="system"
              checked={theme === 'system'}
              onChange={(e) => setTheme(e.target.value as 'system')}
              style={{ marginRight: '0.75rem', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)' }}>{t('appearance.system')}</span>
          </label>
        </div>
      </fieldset>

      {/* Language Section */}
      <fieldset style={{
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: 'var(--color-bg-secondary)'
      }}>
        <legend style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '0 0.5rem',
          color: 'var(--color-text-primary)'
        }}>
          {t('language.title')}
        </legend>
        <label style={{
          display: 'block',
          width: '100%'
        }}>
          <span className="sr-only">{t('language.select')}</span>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'zh')}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="zh">{t('language.chinese')}</option>
            <option value="en">{t('language.english')}</option>
          </select>
        </label>
      </fieldset>
    </div>
  )
}
