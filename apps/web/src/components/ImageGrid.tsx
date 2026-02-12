import { useVirtualizer } from '@tanstack/react-virtual'
import { useTranslation } from 'react-i18next'
import { useImageStore } from '@/stores/imageStore'
import { imageApi } from '@/lib/api'
import { copyImageToClipboard } from '@/lib/clipboard'
import { toast } from 'sonner'
import { useRef, useState, useEffect, useCallback } from 'react'
import { EmptyState } from '@/components/EmptyState'
import '@/styles/skeleton.css'
import '@/styles/transitions.css'

interface ImageGridProps {
  onImageClick: (index: number) => void
}

export const ImageGrid = ({ onImageClick }: ImageGridProps) => {
  const { t } = useTranslation('images')
  const { images, isLoading, hasMore, selectedIds, toggleSelect, fetchImages, fetchMore, searchQuery, activeTagFilter } = useImageStore()
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(4)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const handleImageLoaded = useCallback((id: string) => {
    setLoadedImages(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  useEffect(() => {
    if (!parentRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      const newColumns = Math.max(Math.floor(width / 180), 1)
      setColumns(newColumns)
    })

    resizeObserver.observe(parentRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // Infinite scroll: load more when near bottom
  useEffect(() => {
    const el = parentRef.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollHeight - scrollTop - clientHeight < 400 && hasMore && !isLoading) {
        fetchMore()
      }
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, fetchMore])

  const handleCopy = async (e: React.MouseEvent, imageId: string) => {
    e.stopPropagation()
    const url = imageApi.getFullUrl(imageId)
    const toastId = toast.loading(t('clipboard.copying'))
    try {
      const result = await copyImageToClipboard(url, 'original')
      if (result.success) {
        toast.success(t('clipboard.copy_success'), { id: toastId, duration: 2000 })
      } else {
        toast.error(result.error || t('clipboard.copy_failed'), { id: toastId })
      }
    } catch {
      toast.error(t('clipboard.copy_failed'), { id: toastId })
    }
  }

  const rows = Math.ceil(images.length / columns)

  const virtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 3
  })

  if (isLoading && images.length === 0) {
    return (
      <div
        ref={parentRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '8px'
          }}
        >
          {Array.from({ length: columns * 3 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--color-border)'
              }}
            >
              <div className="image-card-spinner" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isLoading && images.length === 0) {
    const hasActiveFilters = searchQuery || activeTagFilter.length > 0
    return (
      <div
        ref={parentRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <EmptyState type={hasActiveFilters ? 'no-results' : 'no-images'} />
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      style={{
        flex: 1,
        height: '100%',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowIndex = virtualRow.index
          const startIndex = rowIndex * columns
          const rowImages = images.slice(startIndex, startIndex + columns)

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${columns}, 1fr)`,
                  gap: '8px',
                  height: '100%'
                }}
              >
                {rowImages.map((image, colIndex) => {
                  const globalIndex = startIndex + colIndex
                  const isSelected = selectedIds.has(image.id)

                  return (
                    <div
                      key={image.id}
                      className={`image-card${isSelected ? ' selected' : ''}`}
                      style={{ position: 'relative' }}
                      onClick={() => onImageClick(globalIndex)}
                    >
                      {/* Loading spinner — visible until image loads */}
                      {!loadedImages.has(image.id) && (
                        <div className="image-card-spinner" />
                      )}
                      <img
                        src={imageApi.getThumbnailUrl(image.id)}
                        alt=""
                        aria-label={image.originalName}
                        onLoad={() => handleImageLoaded(image.id)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          opacity: loadedImages.has(image.id) ? 1 : 0
                        }}
                      />
                      {/* Copy button - top right, visible on hover */}
                      <div
                        className="image-card-copy-btn"
                        onClick={(e) => handleCopy(e, image.id)}
                        title={t('clipboard.copy')}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--color-surface-float)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.15s ease',
                          zIndex: 1
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--color-text-primary)"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(image.id)
                        }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--color-surface-float)',
                          border: isSelected ? 'none' : '2px solid var(--color-border-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isSelected && (
                          <svg
                            style={{ width: '16px', height: '16px', color: 'white' }}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      {/* Tag pills */}
                      {image.tags && image.tags.length > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '8px',
                            left: '8px',
                            right: '8px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                            pointerEvents: 'none'
                          }}
                        >
                          {image.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.id}
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-border)',
                                borderRadius: '4px',
                                color: 'var(--color-text-primary)',
                                fontWeight: 500
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {image.tags.length > 3 && (
                            <span
                              style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                backgroundColor: 'var(--color-border)',
                                borderRadius: '4px',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 500
                              }}
                            >
                              {t('grid.more_tags', { count: image.tags.length - 3 })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
