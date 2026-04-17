import React from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { TagFilter } from '@/components/TagFilter'
import { SearchBar } from '@/components/SearchBar'
import { UploadQueue } from '@/features/upload/UploadQueue'

export const SearchRail: React.FC = () => {
  const { t } = useTranslation('common')
  
  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }} data-testid="search-rail">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            {t('app_name')}
          </Link>
        </h1>
        <Link
          to="/settings"
          style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
          aria-label={t('nav.settings')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2-5.2l-4.2 4.2m0 6l4.2 4.2" />
          </svg>
        </Link>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <SearchBar />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <UploadQueue />
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <TagFilter isOpen={true} onClose={() => {}} />
      </div>
    </div>
  )
}

