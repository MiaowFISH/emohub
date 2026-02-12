import { useTranslation } from 'react-i18next'

interface EmptyStateProps {
  type: 'no-images' | 'no-results'
}

export const EmptyState = ({ type }: EmptyStateProps) => {
  const { t } = useTranslation('images')

  const isNoImages = type === 'no-images'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center'
      }}
    >
      {/* Icon */}
      {isNoImages ? (
        // Folder/Upload icon for no images
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      ) : (
        // Search icon for no results
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )}

      {/* Title */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          margin: '0 0 8px 0'
        }}
      >
        {isNoImages ? t('empty.no_images_title') : t('empty.no_results_title')}
      </h3>

      {/* Description */}
      <p
        style={{
          fontSize: '14px',
          color: 'var(--color-text-muted)',
          margin: 0,
          maxWidth: '400px'
        }}
      >
        {isNoImages ? t('empty.no_images_description') : t('empty.no_results_description')}
      </p>
    </div>
  )
}
