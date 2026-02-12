import { useTranslation } from 'react-i18next'
import '@/styles/skeleton.css'

export const SkeletonCard = () => {
  const { t } = useTranslation('images')

  return (
    <div className="skeleton-card" aria-busy="true" role="status">
      <span className="sr-only">{t('grid.loading_image')}</span>
      <div className="skeleton-shimmer" />
    </div>
  )
}
