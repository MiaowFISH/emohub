import { useTranslation } from 'react-i18next'
import { useImageStore } from '@/stores/imageStore'

interface TagFilterProps {
  isOpen?: boolean
  onClose?: () => void
}

export const TagFilter = ({ isOpen = false, onClose }: TagFilterProps = {}) => {
  const { t } = useTranslation('images')
  const { t: tCommon } = useTranslation('common')
  const { images, activeTagFilter, fetchImages, searchQuery } = useImageStore()

  const tagCounts = new Map<string, { id: string, name: string, imageCount: number }>()
  images.forEach((image) => {
    image.tags?.forEach((tag) => {
      const existing = tagCounts.get(tag.id)
      if (existing) {
        existing.imageCount += 1
        return
      }

      tagCounts.set(tag.id, {
        id: tag.id,
        name: tag.name,
        imageCount: 1
      })
    })
  })

  const sortedTags = [...tagCounts.values()].sort((a, b) => a.name.localeCompare(b.name))
  const activeTagIds = new Set(activeTagFilter)

  const handleTagToggle = (tagId: string) => {
    const newTags = new Set(activeTagIds)
    if (newTags.has(tagId)) newTags.delete(tagId)
    else newTags.add(tagId)
    fetchImages(1, newTags.size > 0 ? Array.from(newTags) : undefined, searchQuery || undefined)
    
    // Auto-close sidebar on mobile after selecting a tag
    onClose?.()
  }

  const handleClearFilters = () => {
    fetchImages(1, undefined, searchQuery || undefined)
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          margin: 0
        }}>
          {t('filter.title')}
        </h2>
        {activeTagIds.size > 0 && (
          <button
            onClick={handleClearFilters}
            style={{
              fontSize: '12px',
              color: 'var(--color-accent)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            {tCommon('actions.clear')}
          </button>
        )}
      </div>

      {/* Active filter summary */}
      {activeTagIds.size > 0 && (
        <div style={{
          fontSize: '12px',
          color: 'var(--color-text-secondary)',
          padding: '8px',
          backgroundColor: 'var(--color-bg-secondary)',
          borderRadius: '4px'
        }}>
          {t('filter.showing_count', { count: activeTagIds.size })}
        </div>
      )}

      {/* Tag list */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {sortedTags.length === 0 ? (
          <div style={{
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            padding: '16px'
          }}>
            {t('filter.no_tags')}
          </div>
        ) : (
          sortedTags.map(tag => (
            <label
              key={tag.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
                backgroundColor: activeTagIds.has(tag.id) ? 'var(--color-accent-bg)' : 'transparent'
              }}
              onMouseEnter={(e) => {
                if (!activeTagIds.has(tag.id)) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                }
              }}
              onMouseLeave={(e) => {
                if (!activeTagIds.has(tag.id)) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
                <input
                  type="checkbox"
                  checked={activeTagIds.has(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                style={{
                  cursor: 'pointer',
                  width: '16px',
                  height: '16px'
                }}
              />
              <span style={{
                fontSize: '14px',
                flex: 1
              }}>
                {tag.name}
              </span>
              <span style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                marginLeft: 'auto'
              }}>
                {tag.imageCount}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}
