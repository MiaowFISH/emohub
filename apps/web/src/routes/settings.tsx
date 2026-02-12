import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { SettingsForm } from '@/components/SettingsForm'

const SettingsPage = () => {
  const { t } = useTranslation('settings')

  return (
    <div style={{
      maxWidth: '600px',
      width: '100%',
      margin: '0 auto',
      padding: '2rem'
    }}>
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
