import { useVirtualizer } from '@tanstack/react-virtual'
import { useImageStore } from '@/stores/imageStore'
import { imageApi } from '@/lib/api'
import { useRef, useState, useEffect, useCallback } from 'react'

interface ImageGridProps {
  onImageClick: (index: number) => void
}

export const ImageGrid = ({ onImageClick }: ImageGridProps) => {
  const { images, isLoading, hasMore, selectedIds, toggleSelect, fetchImages, fetchMore } = useImageStore()
  const parentRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  useEffect(() => {
    if (!parentRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      const newColumns = Math.max(Math.floor(width / 200), 2)
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af'
        }}
      >
        <p>Loading...</p>
      </div>
    )
  }

  if (!isLoading && images.length === 0) {
    return (
      <div
        ref={parentRef}
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af'
        }}
      >
        <p>No images yet. Upload some stickers!</p>
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
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: isSelected ? '3px solid #3b82f6' : '1px solid #e5e7eb',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => onImageClick(globalIndex)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)'
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <img
                        src={imageApi.getThumbnailUrl(image.id)}
                        alt={image.originalName}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
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
                          backgroundColor: isSelected ? '#3b82f6' : 'rgba(255, 255, 255, 0.8)',
                          border: isSelected ? 'none' : '2px solid #d1d5db',
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
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                color: '#374151',
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
                                backgroundColor: '#e5e7eb',
                                borderRadius: '4px',
                                color: '#6b7280',
                                fontWeight: 500
                              }}
                            >
                              +{image.tags.length - 3} more
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
