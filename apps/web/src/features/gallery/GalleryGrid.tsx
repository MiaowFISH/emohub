import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ImageGrid as BaseImageGrid } from '@/components/ImageGrid'
import { ImageLightbox } from '@/components/ImageLightbox'
import { useImageStore } from '@/stores/imageStore'
import { ImageToolbar } from '@/components/ImageToolbar'

export const GalleryGrid: React.FC = () => {
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const { images } = useImageStore()
  const { t } = useTranslation('common')

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }} data-testid="gallery-grid">
      <Link
        to="/settings"
        className="header-settings-mobile"
        data-testid="mobile-settings-link"
        aria-label={t('nav.settings')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2-5.2l-4.2 4.2m0 6l4.2 4.2" />
        </svg>
      </Link>
      <ImageToolbar />
      <BaseImageGrid onImageClick={setLightboxIndex} />
      <ImageLightbox
        images={images}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
      />
    </div>
  )
}
