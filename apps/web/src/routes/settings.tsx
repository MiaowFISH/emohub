import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SettingsForm } from '@/components/SettingsForm'

const SettingsPage = () => {
  const { t } = useTranslation('settings')
  const { t: tCommon } = useTranslation('common')

  return (
    <div style={{
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      padding: '2rem'
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: 'var(--color-accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to {tCommon('app_name')}
        </Link>
      </div>
      <h1 style={{
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: '2rem',
        color: 'var(--color-text-primary)'
      }}>
        {t('title')}
      </h1>
      <SettingsForm />
    </div>
  )
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage
})
