import { useSettingsStore } from '@/stores/settingsStore'

export const SettingsForm = () => {
  const { theme, language, setTheme, setLanguage } = useSettingsStore()

  return (
    <div style={{
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Theme Section */}
      <fieldset style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        backgroundColor: '#f9fafb'
      }}>
        <legend style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '0 0.5rem',
          color: '#111827'
        }}>
          Appearance
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
            <span style={{ fontSize: '0.9375rem', color: '#374151' }}>Light</span>
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
            <span style={{ fontSize: '0.9375rem', color: '#374151' }}>Dark</span>
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
            <span style={{ fontSize: '0.9375rem', color: '#374151' }}>System</span>
          </label>
        </div>
      </fieldset>

      {/* Language Section */}
      <fieldset style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '1.5rem',
        backgroundColor: '#f9fafb'
      }}>
        <legend style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          padding: '0 0.5rem',
          color: '#111827'
        }}>
          Language
        </legend>
        <label style={{
          display: 'block',
          width: '100%'
        }}>
          <span className="sr-only">Select language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'zh')}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>
      </fieldset>
    </div>
  )
}
